import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
 *    partial edit to stage, stored verbatim in product.pending_changes,
 *    then copied onto the product's real columns on ADMIN approval via
 *    Object.assign (products.service.ts's applyApproval()).
 *
 * `changes` is validated as an actual UpdateProductDto instance (not just
 * "any object") specifically because of that Object.assign: main.ts's
 * global ValidationPipe only strips whitelist violations on properties it
 * recognizes as belonging to a validated nested class. Without
 * @ValidateNested()/@Type() here, `changes` was accepted as an opaque
 * object and its keys passed through untouched, so a submission could
 * smuggle in fields that aren't on UpdateProductDto at all (e.g. status,
 * organizationId, createdBy, publishedAt) and have them applied to the
 * product verbatim once an Admin approved the edit. Routing it through
 * UpdateProductDto closes that gap using the same whitelist the DTO
 * already enforces on PATCH — no new business rule invented, just applying
 * the existing one where it was previously skipped.
 */
export class SubmitProductDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProductDto)
  changes?: UpdateProductDto;
}
