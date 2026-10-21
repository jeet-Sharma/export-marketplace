import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Body for POST /catalog/products/:id/approve and /reject — shared by both
 * the CHECKER stage (vendor side) and ADMIN stage (platform side); the
 * service determines which stage applies from the product's current status.
 *
 * Maps to product_approval_log.action/comments (Part 3.5). The migration's
 * CHECK (action = 'APPROVED' OR coalesce(btrim(comments), '') <> '') means
 * comments are required when rejecting — enforced here so the DB constraint
 * is never the first thing to catch a missing reason.
 */
export class ReviewProductDto {
  @IsIn(['APPROVED', 'REJECTED'])
  action!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MinLength(1)
  comments?: string;
}
