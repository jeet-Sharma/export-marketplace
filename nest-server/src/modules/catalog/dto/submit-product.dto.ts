import { IsObject, IsOptional } from 'class-validator';
import { UpdateProductDto } from './update-product.dto.js';

/**
 * Body for POST /catalog/products/:id/submit.
 *
 * Two cases per Part 3.1's status flow, both handled by the same service
 * method based on the product's CURRENT status (not by this DTO):
 *  - DRAFT/REJECTED -> PENDING_CHECKER: `changes` is ignored; the product's
 *    own columns are submitted for review as-is.
 *  - PUBLISHED/APPROVED -> pending_changes set, pending_status = PENDING_CHECKER
 *    (M-03, "editing a live product keeps it live"): `changes` is the
 *    partial edit to stage, stored verbatim in product.pending_changes.
 *
 * `changes` is intentionally typed loosely (UpdateProductDto shape,
 * validated only as an object) because it is stored as opaque JSONB and
 * applied wholesale on approval — the migration does not constrain its
 * shape beyond "valid JSON", so no additional rule is invented here.
 */
export class SubmitProductDto {
  @IsOptional()
  @IsObject()
  changes?: UpdateProductDto;
}
