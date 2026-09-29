import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ProductEntity } from './entities/product.entity.js';
import { OrganizationEntity } from '../identity/entities/organization.entity.js';
import { ProductApprovalLogService } from './product-approval-log.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { SubmitProductDto } from './dto/submit-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';

/**
 * Business logic for `product` (Part 3.1) — the Maker -> Checker -> Admin
 * approval pipeline, and the "editing a live product keeps it live" (M-03)
 * edit-in-place flow via pending_changes/pending_status.
 *
 * Every method is scoped by organizationId: reads filter WHERE
 * organization_id = :organizationId, writes check the row's
 * organization_id before touching it. This is the app-level half of the
 * two-lock model in Part 0.11 (RLS is the other half, not enabled yet).
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly approvalLogService: ProductApprovalLogService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(organizationId: string): Promise<ProductEntity[]> {
    return this.productRepository.find({ where: { organizationId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id, organizationId } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  /**
   * Maker creates a product. Starts in DRAFT (the column default) — no
   * status is accepted from the caller.
   */
  async create(dto: CreateProductDto, organizationId: string, userId: string): Promise<ProductEntity> {
    const product = this.productRepository.create({
      ...dto,
      publicId: randomUUID(),
      organizationId,
      createdBy: userId,
      categoryId: dto.categoryId.toString(),
      basePrice: dto.basePrice.toString(),
      moq: dto.moq.toString(),
      weightKg: dto.weightKg?.toString() ?? null,
      lengthCm: dto.lengthCm?.toString() ?? null,
      widthCm: dto.widthCm?.toString() ?? null,
      heightCm: dto.heightCm?.toString() ?? null,
    });
    return this.productRepository.save(product);
  }

  /**
   * Edits a DRAFT (or REJECTED) product directly on its own columns. A
   * PUBLISHED/APPROVED product must go through submit() instead — the
   * migration's CHECK (pending_changes IS NULL OR status IN
   * ('PUBLISHED','APPROVED')) means pending_* only ever applies there, so
   * this method refuses to touch a live product's columns directly.
   */
  async update(id: string, dto: UpdateProductDto, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);

    if (product.status === 'PUBLISHED' || product.status === 'APPROVED') {
      throw new ConflictException(
        'A published or approved product cannot be edited directly — submit the change for review instead.',
      );
    }

    const patch: Record<string, unknown> = { ...dto };
    if (dto.categoryId !== undefined) patch.categoryId = dto.categoryId.toString();
    if (dto.basePrice !== undefined) patch.basePrice = dto.basePrice.toString();
    if (dto.moq !== undefined) patch.moq = dto.moq.toString();
    if (dto.weightKg !== undefined) patch.weightKg = dto.weightKg.toString();
    if (dto.lengthCm !== undefined) patch.lengthCm = dto.lengthCm.toString();
    if (dto.widthCm !== undefined) patch.widthCm = dto.widthCm.toString();
    if (dto.heightCm !== undefined) patch.heightCm = dto.heightCm.toString();

    Object.assign(product, patch);
    return this.productRepository.save(product);
  }

  /**
   * Submits a product for review (Part 3.1 status flow diagrams).
   *
   *  - DRAFT/REJECTED  -> PENDING_CHECKER (status changes directly)
   *  - PUBLISHED/APPROVED -> pending_changes/pending_status set (M-03);
   *    status itself does NOT change, so buyers keep seeing the current
   *    live version while the edit is in review.
   *
   * Any other current status (already PENDING_CHECKER/PENDING_ADMIN, or
   * DELISTED) cannot be submitted again.
   */
  async submit(id: string, dto: SubmitProductDto, organizationId: string, userId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);

    if (product.status === 'DRAFT' || product.status === 'REJECTED') {
      product.status = 'PENDING_CHECKER';
      return this.productRepository.save(product);
    }

    if (product.status === 'PUBLISHED' || product.status === 'APPROVED') {
      if (!dto.changes || Object.keys(dto.changes).length === 0) {
        throw new ConflictException('An edit to a live product requires at least one changed field.');
      }
      product.pendingChanges = dto.changes as Record<string, unknown>;
      product.pendingStatus = 'PENDING_CHECKER';
      product.pendingSubmittedBy = userId;
      product.pendingSubmittedAt = new Date();
      return this.productRepository.save(product);
    }

    throw new ConflictException(`Product in status ${product.status} cannot be submitted for review.`);
  }

  /**
   * Checker or Admin approves/rejects, depending on the product's current
   * pending stage. Both stages share this method because the only
   * difference between them is which status value is being resolved and
   * what it becomes next — the self-approval rule and the append-only log
   * write are identical.
   *
   * Self-approval is refused exactly as documented in the schema doc's
   * "Approval can't be self-approval" UPDATE statement (Part 3.1, M-02):
   * the actor cannot be the same person who created the product (new
   * product) or proposed the edit (pending edit), UNLESS the organization
   * has requires_second_approver = false.
   */
  async review(
    id: string,
    dto: ReviewProductDto,
    organizationId: string,
    userId: string,
  ): Promise<ProductEntity> {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const orgRepo = manager.getRepository(OrganizationEntity);

      const product = await productRepo.findOne({ where: { id, organizationId } });
      if (!product) {
        throw new NotFoundException(`Product ${id} not found`);
      }

      const { stage, isEdit } = this.resolveReviewStage(product);

      const submitter = isEdit ? product.pendingSubmittedBy : product.createdBy;
      if (submitter === userId) {
        const org = await orgRepo.findOne({ where: { id: organizationId } });
        if (!org || org.requiresSecondApprover) {
          throw new ForbiddenException("You can't approve or reject content you submitted.");
        }
      }

      const changesSnapshot = isEdit
        ? (product.pendingChanges as Record<string, unknown>)
        : this.snapshotProduct(product);

      if (dto.action === 'APPROVED') {
        this.applyApproval(product, stage, isEdit);
      } else {
        this.applyRejection(product, isEdit);
      }

      const saved = await productRepo.save(product);

      await this.approvalLogService.record(
        {
          productId: product.id,
          organizationId,
          stage,
          action: dto.action,
          changeType: isEdit ? 'EDIT' : 'NEW_PRODUCT',
          changesSnapshot,
          actorUserId: userId,
          comments: dto.comments ?? null,
        },
        manager,
      );

      return saved;
    });
  }

  /**
   * APPROVED -> PUBLISHED (Part 3.1 status diagram). A separate action
   * from admin approval — an approved product is not automatically live;
   * this is what makes it visible to buyers, and is when published_at is
   * first set.
   */
  async publish(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);
    if (product.status !== 'APPROVED') {
      throw new ConflictException(`Product in status ${product.status} cannot be published; it must be APPROVED first.`);
    }
    product.status = 'PUBLISHED';
    product.publishedAt = product.publishedAt ?? new Date();
    return this.productRepository.save(product);
  }

  /**
   * PUBLISHED -> DELISTED (Part 3.1 status diagram) — removes the product
   * from buyer visibility without deleting the row (no hard deletes, Part
   * 0.8's rule applies here even though products aren't buyer PII).
   */
  async delist(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);
    if (product.status !== 'PUBLISHED') {
      throw new ConflictException(`Product in status ${product.status} cannot be delisted; it must be PUBLISHED.`);
    }
    product.status = 'DELISTED';
    return this.productRepository.save(product);
  }

  /** Determines whether this is a new-product review or a live-edit review, and which stage is being resolved. */
  private resolveReviewStage(product: ProductEntity): { stage: 'CHECKER' | 'ADMIN'; isEdit: boolean } {
    if (product.status === 'PENDING_CHECKER') {
      return { stage: 'CHECKER', isEdit: false };
    }
    if (product.status === 'PENDING_ADMIN') {
      return { stage: 'ADMIN', isEdit: false };
    }
    if (product.pendingStatus === 'PENDING_CHECKER') {
      return { stage: 'CHECKER', isEdit: true };
    }
    if (product.pendingStatus === 'PENDING_ADMIN') {
      return { stage: 'ADMIN', isEdit: true };
    }
    throw new ConflictException('Product has nothing pending review.');
  }

  private applyApproval(product: ProductEntity, stage: 'CHECKER' | 'ADMIN', isEdit: boolean): void {
    if (!isEdit) {
      if (stage === 'CHECKER') {
        product.status = 'PENDING_ADMIN';
        return;
      }
      // ADMIN stage on a new product: the Part 3.1 diagram shows
      // "APPROVED --> PUBLISHED" as two separate arrows, so admin
      // approval only reaches APPROVED here. Going live is a distinct
      // action — see publish().
      product.status = 'APPROVED';
      return;
    }

    if (stage === 'CHECKER') {
      product.pendingStatus = 'PENDING_ADMIN';
      return;
    }

    // ADMIN approves an edit: copy pending_changes onto the real columns
    // and clear pending_*, all in this same transaction (M-03).
    Object.assign(product, product.pendingChanges);
    product.pendingChanges = null;
    product.pendingStatus = null;
    product.pendingSubmittedBy = null;
    product.pendingSubmittedAt = null;
  }

  private applyRejection(product: ProductEntity, isEdit: boolean): void {
    if (!isEdit) {
      product.status = 'REJECTED';
      return;
    }
    // Rejecting a live edit discards the proposed change; the product
    // itself is untouched and stays PUBLISHED/APPROVED.
    product.pendingChanges = null;
    product.pendingStatus = null;
    product.pendingSubmittedBy = null;
    product.pendingSubmittedAt = null;
  }

  private snapshotProduct(product: ProductEntity): Record<string, unknown> {
    const { id: _id, organizationId: _organizationId, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } =
      product;
    return rest as Record<string, unknown>;
  }
}
