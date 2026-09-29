import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

/**
 * Body for POST /catalog/products/:productId/price-tiers (Part 3.3).
 *
 * Only the two constraints the migration actually enforces are validated
 * here: CHECK (max_qty IS NULL OR max_qty > min_qty) and CHECK (unit_price
 * > 0). No gap/continuity rule between tiers and no "first tier must equal
 * product.moq" rule are enforced — the migration does not constrain
 * either, so none is invented here. Overlap between tiers on the same
 * product is refused by the tier_no_overlap GiST exclusion constraint at
 * the database level; a violation surfaces as a 500 from the DB driver,
 * not a pre-check in this DTO or the service.
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
