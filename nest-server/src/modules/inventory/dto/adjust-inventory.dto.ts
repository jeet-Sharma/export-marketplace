import { IsIn, IsNumber, IsString, MinLength } from 'class-validator';

/**
 * Body for POST /inventory/:productId/adjust (Part 4.3).
 *
 * quantityChange is signed: positive for ADJUSTMENT correcting stock
 * upward (e.g. a recount finds more than recorded), negative for
 * ADJUSTMENT correcting downward or for DAMAGE. notes is required by the
 * migration's CHECK for both movement types.
 */
export class AdjustInventoryDto {
  @IsIn(['ADJUSTMENT', 'DAMAGE'])
  movementType!: 'ADJUSTMENT' | 'DAMAGE';

  @IsNumber()
  quantityChange!: number;

  @IsString()
  @MinLength(1)
  notes!: string;
}
