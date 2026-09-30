import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductApprovalLogEntity } from './entities/product-approval-log.entity.js';

export interface RecordApprovalLogInput {
  productId: string;
  organizationId: string;
  stage: 'CHECKER' | 'ADMIN';
  action: 'APPROVED' | 'REJECTED';
  changeType: 'NEW_PRODUCT' | 'EDIT';
  changesSnapshot: Record<string, unknown>;
  actorUserId: string;
  comments?: string | null;
}

/**
 * Reads and writes for product_approval_log (Part 3.5) — append-only:
 * CreateVendorCatalog1732800000003 grants no UPDATE/DELETE on this table
 * at the DB role level, so this service only ever inserts or selects.
 *
 * `record` is called by ProductsService inside the same transaction as the
 * product status change it is logging (see products.service.ts), never
 * on its own — that is what keeps "a product was approved" and "the log
 * says it was approved" atomic.
 */
@Injectable()
export class ProductApprovalLogService {
  constructor(
    @InjectRepository(ProductApprovalLogEntity)
    private readonly approvalLogRepository: Repository<ProductApprovalLogEntity>,
  ) {}

  /**
   * Inserts one append-only log row. Pass `manager` to run inside an
   * existing transaction (the normal case — see ProductsService); omitting
   * it falls back to the repository's own connection for ad-hoc use (e.g.
   * tests, scripts).
   */
  async record(input: RecordApprovalLogInput, manager?: EntityManager): Promise<ProductApprovalLogEntity> {
    const repository = manager ? manager.getRepository(ProductApprovalLogEntity) : this.approvalLogRepository;

    const row = repository.create({
      productId: input.productId,
      organizationId: input.organizationId,
      stage: input.stage,
      action: input.action,
      changeType: input.changeType,
      changesSnapshot: input.changesSnapshot,
      actorUserId: input.actorUserId,
      comments: input.comments ?? null,
    });

    return repository.save(row);
  }

  /**
   * History for one product, newest first — matches the pal_by_product
   * index (product_id, created_at). Scoped by organizationId so a vendor
   * can never read another vendor's approval history for a product id
   * they don't own.
   */
  async findByProduct(productId: string, organizationId: string): Promise<ProductApprovalLogEntity[]> {
    return this.approvalLogRepository.find({
      where: { productId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }
}
