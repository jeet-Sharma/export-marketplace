import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  type EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { ProductCountry } from '../../database/entities/product-country.entity.js';
import { ProductImage } from '../../database/entities/product-image.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import {
  ProductDetailDto,
  toProductDetailDto,
} from '../../common/dto/product-detail.dto.js';
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  type AllowedImageContentType,
  MAX_IMAGE_UPLOAD_BYTES,
} from '../../aws/aws.constants.js';
import {
  STORAGE_STRATEGY,
  type StorageStrategy,
} from '../../storage/storage-strategy.interface.js';
import type { CreateProductImageDto } from './dto/create-product-image.dto.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import {
  ProductImageResponseDto,
  toProductImageResponseDto,
} from './dto/product-image-response.dto.js';
import type { PriceTierDto } from './dto/price-tier.dto.js';
import type { QueryAdminProductsDto } from './dto/query-admin-products.dto.js';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';

const PRESIGNED_UPLOAD_URL_TTL_SECONDS = 900;

// Collapses an optional DTO field into the `T | null` shape every
// nullable Product column expects — `undefined` (field absent from the
// request) and explicit `null` both become `null`. Used to cut the
// repeated `dto.x ?? null` / `dto.x !== undefined ? dto.x.toString() : null`
// boilerplate across create()/update() below.
function toNullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

// Same as toNullable, but for numeric DTO fields that must be persisted
// as `numeric`-column strings (see marketplace-domain.md's money-handling
// rule) rather than JS numbers.
function toNullableNumericString(
  value: number | null | undefined,
): string | null {
  return value !== undefined && value !== null ? value.toString() : null;
}

// Fields a product must have before it may become/remain PUBLISHED. Per
// Phase-1-API-Specification-v0.1 section 18, the exact mandatory set is
// still an open BRD/PRD decision — this list is the minimal, defensible
// subset (name + vendor are already DB NOT NULL; this adds the fields a
// public listing/detail page cannot reasonably render without). Revisit
// once Product Management finalizes section 18's open decisions.
const PUBLISH_REQUIRED_FIELDS: Array<keyof Product> = ['name', 'vendorId'];

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductPriceTier)
    private readonly priceTierRepository: Repository<ProductPriceTier>,
    @InjectRepository(ProductCountry)
    private readonly productCountryRepository: Repository<ProductCountry>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
    @Inject(STORAGE_STRATEGY)
    private readonly storageStrategy: StorageStrategy,
  ) {}

  async findAll(
    query: QueryAdminProductsDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor');

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.vendorId) {
      qb.andWhere('product.vendorId = :vendorId', { vendorId: query.vendorId });
    }
    if (query.search) {
      qb.andWhere('product.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC', 'NULLS LAST');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC', 'NULLS LAST');
        break;
      case 'newest':
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalItems] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  // Full management view, including images/price tiers/country mappings
  // (section 6.2). Draft or published — authorization (product.view) is
  // enforced at the controller/guard level, not here.
  async findOneForAdmin(id: string): Promise<ProductDetailDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'vendor',
        'sourceCountry',
        'createdByUser',
        'updatedByUser',
      ],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [images, priceTiers, productCountries] = await Promise.all([
      this.productImageRepository.find({
        where: { productId: id },
        order: { sortOrder: 'ASC' },
      }),
      this.priceTierRepository.find({
        where: { productId: id },
        order: { minQuantity: 'ASC' },
      }),
      this.productCountryRepository.find({
        where: { productId: id },
        relations: ['country'],
      }),
    ]);

    return toProductDetailDto(
      product,
      await Promise.all(
        images.map((image) =>
          toProductImageResponseDto(image, this.storageStrategy),
        ),
      ),
      priceTiers,
      productCountries.map((pc) => pc.country),
    );
  }

  // Slug allocation (and the race it's exposed to): generateUniqueSlug's
  // existence check is only a best-effort first pass, since it runs
  // before the transaction opens — two concurrent creates for the same
  // product name can both pass it before either commits. The actual
  // guarantee is the DB's UQ_products_slug constraint; MAX_SLUG_RETRIES
  // below catches that constraint violation and retries with a freshly
  // generated candidate rather than letting a raw QueryFailedError
  // surface as a confusing 500 (see createWithUniqueSlug).
  private static readonly MAX_SLUG_RETRIES = 5;

  async create(
    dto: CreateProductDto,
    createdByUserId: string,
  ): Promise<Product> {
    this.assertPriceTiersDoNotOverlap(dto.priceTiers);

    for (
      let attempt = 1;
      attempt <= ProductsService.MAX_SLUG_RETRIES;
      attempt++
    ) {
      const slug = await this.generateUniqueSlug(
        dto.name,
        attempt > 1 ? attempt : undefined,
      );

      try {
        return await this.dataSource.transaction((manager) =>
          this.createWithSlug(manager, dto, slug, createdByUserId),
        );
      } catch (error) {
        if (
          this.isUniqueViolation(error) &&
          attempt < ProductsService.MAX_SLUG_RETRIES
        ) {
          continue;
        }
        if (this.isUniqueViolation(error)) {
          throw new ConflictException({
            code: 'CONFLICT',
            message:
              'Could not allocate a unique product slug, please try again',
            errors: [
              {
                field: 'name',
                message: 'A product with a conflicting slug already exists',
              },
            ],
          });
        }
        this.rethrowAsValidationError(error);
      }
    }

    // Unreachable — the loop above always returns or throws — but
    // satisfies the compiler's control-flow analysis.
    throw new ConflictException('Could not allocate a unique product slug');
  }

  private async createWithSlug(
    manager: EntityManager,
    dto: CreateProductDto,
    slug: string,
    createdByUserId: string,
  ): Promise<Product> {
    const product = manager.create(Product, {
      slug,
      name: dto.name,
      description: toNullable(dto.description),
      categoryId: toNullable(dto.categoryId),
      vendorId: dto.vendorId,
      status: dto.status,
      price: toNullableNumericString(dto.price),
      currencyCode: toNullable(dto.currencyCode),
      unit: toNullable(dto.unit),
      moq: toNullableNumericString(dto.moq),
      hsCode: toNullable(dto.hsCode),
      sourceCountryId: toNullable(dto.sourceCountryId),
      exportEligibility: toNullable(dto.exportEligibility),
      countryRestrictions: toNullable(dto.countryRestrictions),
      estimatedDeliveryText: toNullable(dto.estimatedDeliveryText),
      dutiesTaxesNote: toNullable(dto.dutiesTaxesNote),
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
      publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
    });

    if (dto.status === 'PUBLISHED') {
      this.assertPublishable(product);
    }

    const saved = await manager.save(Product, product);

    if (dto.priceTiers?.length) {
      await manager.save(
        ProductPriceTier,
        dto.priceTiers.map((tier) => this.toPriceTierEntity(saved.id, tier)),
      );
    }

    if (dto.targetCountryIds?.length) {
      await manager.save(
        ProductCountry,
        dto.targetCountryIds.map((countryId) => ({
          productId: saved.id,
          countryId,
        })),
      );
    }

    return saved;
  }

  // TypeORM wraps the underlying pg driver error in QueryFailedError;
  // Postgres unique-violation is SQLSTATE 23505. Checked defensively
  // against both `driverError.code` (current typeorm/pg) and a top-level
  // `.code` fallback in case that shape changes across versions. Shared
  // by create()'s slug-retry logic and addImage()'s primary-image race
  // handling — both are "two concurrent writers hit the same unique
  // constraint" cases, just on different constraints.
  private isUniqueViolation(error: unknown): boolean {
    return this.getUniqueViolationConstraint(error) !== undefined;
  }

  // Same SQLSTATE 23505 check as isUniqueViolation, but also returns which
  // constraint was violated — needed in addImage() to tell apart "two
  // concurrent requests both tried to set isPrimary=true"
  // (UQ_product_images_product_id_primary) from "two concurrent requests
  // tried to register the same storage object key"
  // (UQ_product_images_s3_object_key); each needs a different error
  // message/field in the response. Returns the constraint name if one is
  // reported, or the literal string 'unknown' if Postgres raised 23505
  // without a constraint name (defensive fallback, same spirit as
  // getForeignKeyViolationField's 'unknown' default) — never `undefined`
  // for an actual 23505, so callers can rely on "undefined means not a
  // unique violation at all".
  private getUniqueViolationConstraint(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }
    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; constraint?: string };
      }
    ).driverError;
    const code = driverError?.code ?? (error as { code?: string }).code;
    if (code !== '23505') {
      return undefined;
    }
    return driverError?.constraint ?? 'unknown';
  }

  // Postgres foreign-key-violation is SQLSTATE 23503 — raised when
  // categoryId/vendorId/sourceCountryId (on products) or a targetCountryIds
  // entry (on product_countries) doesn't reference an existing row. Without
  // this, that violation reaches HttpExceptionFilter as a raw
  // QueryFailedError and surfaces to the client as an opaque 500
  // INTERNAL_ERROR with no indication of which field was the problem.
  // CONSTRAINT_FIELD_MAP below turns the DB constraint name Postgres
  // reports back into the exact request field it corresponds to.
  private static readonly CONSTRAINT_FIELD_MAP: Record<string, string> = {
    FK_products_category_id: 'categoryId',
    FK_products_vendor_id: 'vendorId',
    FK_products_source_country_id: 'sourceCountryId',
    FK_product_countries_country_id: 'targetCountryIds',
  };

  private getForeignKeyViolationField(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }
    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; constraint?: string };
      }
    ).driverError;
    const code = driverError?.code ?? (error as { code?: string }).code;
    if (code !== '23503') {
      return undefined;
    }
    const constraint = driverError?.constraint;
    return (
      (constraint && ProductsService.CONSTRAINT_FIELD_MAP[constraint]) ??
      'unknown'
    );
  }

  // Converts an unhandled FK-violation into the same {code, message,
  // errors} envelope assertPublishable/assertPriceTiersDoNotOverlap
  // already use, instead of letting it fall through as a raw 500. Shared
  // by create() and update() — both insert/update the same FK-bearing
  // columns.
  private rethrowAsValidationError(error: unknown): never {
    const field = this.getForeignKeyViolationField(error);
    if (field) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'One or more referenced records do not exist',
        errors: [
          { field, message: `${field} does not reference an existing record` },
        ],
      });
    }
    throw error;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    updatedByUserId: string,
  ): Promise<Product> {
    this.assertPriceTiersDoNotOverlap(dto.priceTiers);

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Loaded (and locked) INSIDE the transaction, not before it — a
        // prior version loaded the product before the transaction opened,
        // then saved that same (possibly stale) in-memory entity at the
        // end. Two concurrent PATCH requests for the same product could
        // both load the pre-update row, each apply their own fields, and
        // whichever committed last would silently overwrite the other's
        // changes (last-write-wins), with no error and no indication to
        // either caller. `pessimistic_write` issues `SELECT ... FOR
        // UPDATE`, which blocks a second concurrent transaction from
        // reading this row until the first commits — so the second
        // request's load reflects the first request's committed changes,
        // and genuinely concurrent edits are serialized rather than
        // silently lost. This project has no `version` column on Product
        // (optimistic locking would need a schema migration + a client
        // contract change to send back a version/etag); row locking
        // achieves the same correctness guarantee without either.
        const product = await manager.findOne(Product, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Only fields actually present in the PATCH body are touched —
        // `undefined` means "leave as-is", `null`/a real value both mean
        // "set it" (via toNullable/toNullableNumericString). This is why
        // each assignment is still its own `if (dto.x !== undefined)`
        // guard rather than one generic loop: a loop would need the same
        // per-field undefined check anyway, and this form stays directly
        // traceable against the API spec's section 7 field table.
        if (dto.name !== undefined) product.name = dto.name;
        if (dto.description !== undefined)
          product.description = toNullable(dto.description);
        if (dto.categoryId !== undefined)
          product.categoryId = toNullable(dto.categoryId);
        if (dto.vendorId !== undefined) product.vendorId = dto.vendorId;
        if (dto.price !== undefined)
          product.price = toNullableNumericString(dto.price);
        if (dto.currencyCode !== undefined)
          product.currencyCode = toNullable(dto.currencyCode);
        if (dto.unit !== undefined) product.unit = toNullable(dto.unit);
        if (dto.moq !== undefined)
          product.moq = toNullableNumericString(dto.moq);
        if (dto.hsCode !== undefined) product.hsCode = toNullable(dto.hsCode);
        if (dto.sourceCountryId !== undefined)
          product.sourceCountryId = toNullable(dto.sourceCountryId);
        if (dto.exportEligibility !== undefined)
          product.exportEligibility = toNullable(dto.exportEligibility);
        if (dto.countryRestrictions !== undefined) {
          product.countryRestrictions = toNullable(dto.countryRestrictions);
        }
        if (dto.estimatedDeliveryText !== undefined) {
          product.estimatedDeliveryText = toNullable(dto.estimatedDeliveryText);
        }
        if (dto.dutiesTaxesNote !== undefined)
          product.dutiesTaxesNote = toNullable(dto.dutiesTaxesNote);
        product.updatedBy = updatedByUserId;

        // Published product edits remain published only if the resulting
        // record still passes publish validation (API spec section 6.4/14).
        if (product.status === 'PUBLISHED') {
          this.assertPublishable(product);
        }

        const saved = await manager.save(Product, product);

        if (dto.priceTiers !== undefined) {
          await manager.delete(ProductPriceTier, { productId: id });
          if (dto.priceTiers.length) {
            await manager.save(
              ProductPriceTier,
              dto.priceTiers.map((tier) => this.toPriceTierEntity(id, tier)),
            );
          }
        }

        if (dto.targetCountryIds !== undefined) {
          await manager.delete(ProductCountry, { productId: id });
          if (dto.targetCountryIds.length) {
            await manager.save(
              ProductCountry,
              dto.targetCountryIds.map((countryId) => ({
                productId: id,
                countryId,
              })),
            );
          }
        }

        return saved;
      });
    } catch (error) {
      this.rethrowAsValidationError(error);
    }
  }

  // userId is the acting admin's id, always derived from the authenticated
  // request (@CurrentUser()) at the controller — never client-supplied.
  // Previously this method didn't record who performed the publish, so
  // Product.updatedBy kept whatever value the last field-level PATCH (or
  // the original create()) left behind, meaning the audit trail couldn't
  // show who actually published the product. Publishing is itself a
  // business-meaningful change to the row, so it gets the same updatedBy
  // treatment as update() — see the API spec section 14 audit expectations.
  async publish(id: string, userId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.status === 'PUBLISHED') {
      product.updatedBy = userId;
      return this.productRepository.save(product);
    }

    this.assertPublishable(product);

    product.status = 'PUBLISHED';
    product.publishedAt = new Date();
    product.updatedBy = userId;
    return this.productRepository.save(product);
  }

  // See publish()'s comment — same audit-trail reasoning applies to
  // unpublishing.
  async unpublish(id: string, userId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = 'DRAFT';
    product.updatedBy = userId;
    return this.productRepository.save(product);
  }

  // Requests a presigned upload (POST) for a new product image. The
  // object key is generated server-side (never client-supplied) via
  // storageStrategy.buildProductImageKey, which sanitizes the filename and
  // prefixes a randomUUID() to prevent path traversal/collisions — see
  // security-rules.md.
  //
  // The max upload size is always capped at MAX_IMAGE_UPLOAD_BYTES — never
  // at the client-declared contentLengthBytes — so a client cannot widen
  // its own ceiling by declaring a larger size than it intends to enforce
  // against itself; contentLengthBytes (validated against the same max by
  // RequestUploadUrlDto) is purely informational at this stage. See
  // storageStrategy.getPresignedUpload's comment for why this is a signed
  // POST rather than a plain PUT: only a POST policy lets the provider
  // reject an oversized upload before it's stored, instead of only after
  // (addImage's post-upload check, which still runs as a backstop).
  async requestImageUploadUrl(
    productId: string,
    filename: string,
    contentType: string,
  ): Promise<UploadUrlResponseDto> {
    await this.assertProductExists(productId);
    const key = this.storageStrategy.buildProductImageKey(
      productId,
      filename,
    );
    const { url, httpMethod, fields, expiresInSeconds } =
      await this.storageStrategy.getPresignedUpload(
        key,
        PRESIGNED_UPLOAD_URL_TTL_SECONDS,
        MAX_IMAGE_UPLOAD_BYTES,
        contentType,
      );
    // Relay the strategy's ACTUAL achieved expiry, not the requested
    // PRESIGNED_UPLOAD_URL_TTL_SECONDS constant — S3 honors the request
    // exactly, but Cloudinary enforces its own fixed window regardless of
    // what was asked for, so echoing the constant unconditionally would
    // misreport the real expiry for Cloudinary uploads. See Qodo review
    // Bug #11 and PresignedUpload's doc comment.
    return {
      uploadUrl: url,
      httpMethod,
      fields,
      key,
      expiresInSeconds,
    };
  }

  // Persists image metadata after the client has already uploaded the
  // bytes to S3 via the presigned URL above. Section 9.1.
  //
  // Security: objectKey is client-supplied, so it's verified two ways
  // before being trusted: (1) it must fall under this product's own key
  // prefix (see S3Service.keyBelongsToProduct), which prevents an admin
  // with product.edit on one product from attaching another product's
  // — or an arbitrary — bucket key to this product's metadata; (2) the
  // object must actually exist in the bucket, which prevents recording
  // metadata for an upload that never happened.
  async addImage(
    productId: string,
    dto: CreateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    await this.assertProductExists(productId);

    if (!this.storageStrategy.keyBelongsToProduct(dto.objectKey, productId)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Image object key does not belong to this product',
        errors: [
          {
            field: 'objectKey',
            message: 'objectKey must be a key issued for this product',
          },
        ],
      });
    }

    // Fast-path rejection for the common case: the same objectKey already
    // registered against some image row (any product — the key itself is
    // globally unique in storage, see UQ_product_images_s3_object_key).
    // This is only a best-effort first pass, same caveat as
    // generateUniqueSlug's pre-check: it runs before the transaction
    // opens, so two concurrent addImage calls for the same objectKey can
    // both pass it before either commits. The actual guarantee is the DB
    // unique index; the catch block below converts that violation into
    // the same 409 if this check is lost to the race.
    const existingImageWithKey = await this.productImageRepository.exists({
      where: { s3ObjectKey: dto.objectKey },
    });
    if (existingImageWithKey) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'This storage object is already registered to an image',
        errors: [
          {
            field: 'objectKey',
            message: 'objectKey is already attached to a product image',
          },
        ],
      });
    }

    const metadata = await this.storageStrategy.getObjectMetadata(
      dto.objectKey,
    );
    if (!metadata.exists) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Image object was not found in storage',
        errors: [
          {
            field: 'objectKey',
            message: 'Upload the file before persisting its metadata',
          },
        ],
      });
    }

    // Authoritative size check (API spec section 15: "Restrict product
    // image type, size and upload behavior") — a presigned PUT URL alone
    // can't enforce a hard max (see S3Service.getPresignedUploadUrl's
    // comment), so this is the real enforcement point, checked against
    // what was actually uploaded rather than trusting the client's
    // declared contentLengthBytes from the upload-url request. An
    // oversized object is deleted immediately rather than left orphaned
    // in the bucket.
    if (metadata.sizeBytes > MAX_IMAGE_UPLOAD_BYTES) {
      await this.storageStrategy.delete(dto.objectKey);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Image exceeds the maximum allowed size',
        errors: [
          {
            field: 'objectKey',
            message: `Uploaded file is ${metadata.sizeBytes} bytes, which exceeds the ${MAX_IMAGE_UPLOAD_BYTES} byte limit`,
          },
        ],
      });
    }

    // Authoritative file-TYPE check, based on the uploaded object's actual
    // content (see StorageStrategy.getObjectMetadata's detectedContentType),
    // never the client-declared Content-Type header used to request the
    // upload URL — a malicious or buggy client can set that header to
    // anything regardless of what bytes it actually sends. An object whose
    // real content doesn't match one of ALLOWED_IMAGE_CONTENT_TYPES (e.g.
    // an HTML/script/executable file renamed with a .jpg-looking key) is
    // rejected and deleted immediately, the same treatment as an oversized
    // upload above — it must not be left in storage, and must never be
    // persisted as product image metadata.
    if (
      !metadata.detectedContentType ||
      !ALLOWED_IMAGE_CONTENT_TYPES.includes(
        metadata.detectedContentType as AllowedImageContentType,
      )
    ) {
      await this.storageStrategy.delete(dto.objectKey);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Uploaded file is not a supported image format',
        errors: [
          {
            field: 'objectKey',
            message: `The uploaded file's content does not match an allowed image format (${ALLOWED_IMAGE_CONTENT_TYPES.join(', ')})`,
          },
        ],
      });
    }

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        // Only one primary image per product (API spec section 14). This
        // demote-then-insert is the application-level enforcement; the
        // UQ_product_images_product_id_primary partial unique index
        // (see the migration) is the actual guarantee against two
        // concurrent isPrimary:true requests both demoting before either
        // inserts — if that race is lost, the insert below throws and is
        // converted to a 409 below rather than a raw 500.
        if (dto.isPrimary) {
          await manager.update(
            ProductImage,
            { productId, isPrimary: true },
            { isPrimary: false },
          );
        }

        const image = manager.create(ProductImage, {
          productId,
          s3ObjectKey: dto.objectKey,
          altText: dto.altText ?? null,
          isPrimary: dto.isPrimary ?? false,
          sortOrder: dto.sortOrder ?? 0,
        });
        return await manager.save(ProductImage, image);
      });
      return await toProductImageResponseDto(saved, this.storageStrategy);
    } catch (error) {
      const constraint = this.getUniqueViolationConstraint(error);
      if (constraint === 'UQ_product_images_s3_object_key') {
        // Lost the race the pre-check above couldn't fully close — same
        // user-facing error either way, so the caller can't distinguish
        // "pre-check caught it" from "DB constraint caught it".
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'This storage object is already registered to an image',
          errors: [
            {
              field: 'objectKey',
              message: 'objectKey is already attached to a product image',
            },
          ],
        });
      }
      if (constraint) {
        // Any other unique violation here is the primary-image race
        // (UQ_product_images_product_id_primary) — see the demote-then-
        // insert comment above. Falls back to this message for an
        // unrecognized constraint name too, which is the safer default:
        // surfacing a 409 instead of letting an unexpected unique
        // violation reach the client as a raw 500.
        throw new ConflictException({
          code: 'CONFLICT',
          message:
            'Another image was concurrently set as primary for this product',
          errors: [{ field: 'isPrimary', message: 'Retry the request' }],
        });
      }
      throw error;
    }
  }

  // Removes image metadata and the underlying storage object (section 9.2).
  // The DB row is removed first; the storage delete afterward is
  // best-effort and MUST NOT fail the request if it errors — the DB
  // delete already succeeded by that point, so the client's view (image
  // gone from the product) is already correct, and surfacing a storage
  // error here would make the API report failure for an operation that
  // actually succeeded from the caller's perspective. A storage object
  // left behind after its metadata row is gone is an orphan to clean up
  // later (e.g. a periodic reconciliation job), which is a cheaper
  // failure mode than a DB row pointing at nothing — but the error must
  // still be logged (with the key and the error) so that cleanup is
  // actually possible, rather than silently losing track of the orphan.
  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.productImageRepository.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    await this.productImageRepository.delete({ id: imageId });

    try {
      await this.storageStrategy.delete(image.s3ObjectKey);
    } catch (error) {
      this.logger.error(
        `Failed to delete storage object "${image.s3ObjectKey}" for ` +
          `product image ${imageId} (product ${productId}) after its DB ` +
          `row was removed; the object may be orphaned in storage: ` +
          `${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async assertProductExists(productId: string): Promise<void> {
    const exists = await this.productRepository.exists({
      where: { id: productId },
    });
    if (!exists) {
      throw new NotFoundException('Product not found');
    }
  }

  // Publish requires all PUBLISH_REQUIRED_FIELDS to be present. See the
  // constant's comment — the exact mandatory set remains partly open per
  // the API spec's section 18 and should be revisited with Product
  // Management rather than silently expanded/narrowed here.
  private assertPublishable(product: Product): void {
    const missing = PUBLISH_REQUIRED_FIELDS.filter((field) => {
      const value = product[field];
      return value === null || value === undefined || value === '';
    });
    if (missing.length > 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Product is missing required fields for publishing',
        errors: missing.map((field) => ({
          field,
          message: `${field} is required to publish`,
        })),
      });
    }
  }

  private assertPriceTiersDoNotOverlap(
    tiers: PriceTierDto[] | undefined,
  ): void {
    if (!tiers || tiers.length < 2) {
      return;
    }

    const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const currentMax = current.maxQuantity ?? Infinity;
      if (currentMax >= next.minQuantity) {
        // Overlapping tiers are invalid REQUEST DATA, not a resource-state
        // conflict (ConflictException/409 implies the request would be
        // valid against a different server state, e.g. a duplicate slug —
        // that's not the case here: no retry or server-side state change
        // would ever make this same payload valid). BadRequestException
        // keeps this a 400, consistent with every other DTO-shape-level
        // validation failure (assertPublishable, rethrowAsValidationError)
        // and with HttpExceptionFilter's VALIDATION_ERROR code mapping.
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Price tier ranges must not overlap',
          errors: [
            {
              field: 'priceTiers',
              message: 'Overlapping quantity ranges detected',
            },
          ],
        });
      }
    }
  }

  private toPriceTierEntity(
    productId: string,
    tier: PriceTierDto,
  ): Partial<ProductPriceTier> {
    return {
      productId,
      minQuantity: tier.minQuantity.toString(),
      maxQuantity:
        tier.maxQuantity != null ? tier.maxQuantity.toString() : null,
      price: tier.price.toString(),
      shippingEstimate:
        tier.shippingEstimate != null ? tier.shippingEstimate.toString() : null,
      dutiesEstimate:
        tier.dutiesEstimate != null ? tier.dutiesEstimate.toString() : null,
      taxesEstimate:
        tier.taxesEstimate != null ? tier.taxesEstimate.toString() : null,
      currencyCode: tier.currencyCode,
    };
  }

  // Best-effort uniqueness check — see the MAX_SLUG_RETRIES comment on
  // create(). `retryAttempt`, when provided, salts the starting suffix so
  // a retry after a lost race doesn't recompute the exact same candidate
  // that just lost.
  private async generateUniqueSlug(
    name: string,
    retryAttempt?: number,
  ): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);

    const baseOrFallback = base || 'product';
    let suffix = retryAttempt
      ? retryAttempt * 1000 + Math.floor(Math.random() * 1000)
      : 1;
    let candidate =
      suffix === 1 ? baseOrFallback : `${baseOrFallback}-${suffix}`;

    while (
      await this.productRepository.exists({ where: { slug: candidate } })
    ) {
      suffix += 1;
      candidate = `${baseOrFallback}-${suffix}`;
    }
    return candidate;
  }
}
