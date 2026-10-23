import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_METADATA_KEY = 'requiredPermissions';

// Permission-based authorization, not role-name checks — per
// marketplace-domain.md's "Permission-based authorization" rule. Usage:
// @RequirePermissions('product.create')
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);
