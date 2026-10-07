import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';

// PATCH /admin/products/:id (section 6.4). Status transitions are
// deliberately excluded — they only happen via the dedicated
// /publish and /unpublish endpoints (sections 6.5/6.6), not a generic
// field update, so a PATCH can't silently flip DRAFT<->PUBLISHED.
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['status'] as const)) {}
