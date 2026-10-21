import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

/**
 * Body for POST /catalog/products/:productId/price-tiers (Part 3.3).
 *
 * The two constraints the migration itself enforces are validated here:
 * CHECK (max_qty IS NULL OR max_qty > min_qty) and CHECK (unit_price > 0).
 * Overlap between tiers on the same product is refused by the
 * tier_no_overlap GiST exclusion constraint at the database level; a
 * violation surfaces as a raw driver error, not a pre-check in this DTO or
 * the service.
 *
 * The gap/continuity rule and the "first tier must equal product.moq"
 * rule (Part 3.3's "two rules [that] can't be written as a single-row
 * constraint") are NOT checked per-tier at create time — a vendor builds
 * up tiers one at a time, so requiring gaplessness on every individual
 * POST would reject perfectly normal in-progress tier sets. Both rules are
 * instead checked once, over the whole tier set, at submit time
 * (ProductsService.assertPriceTiersAreGaplessAndMoqAligned), exactly where
 * Part 3.3 says they must be enforced ("DRAFT -> PENDING_CHECKER is
 * refused otherwise").
 */
export class CreatePriceTierDto {
  @IsNumber()
  @Min(0)
  minQty!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxQty?: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;
}
