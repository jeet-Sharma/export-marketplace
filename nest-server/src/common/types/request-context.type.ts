import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Shape of the authenticated principal found on `req.user`, populated by
 * JwtAuthGuard (src/common/guards/jwt-auth.guard.ts) from the access token
 * issued by AuthService.loginBuyer() (same JwtService/AuthConfig — no
 * second token scheme). Catalog/Inventory read this shape without caring
 * how it was populated.
 *
 * userId / organizationId are the same values as users.id / users.organization_id
 * (Data_Modeling_Complete.md Part 2.5) — kept as strings because bigint
 * columns are mapped as strings throughout this codebase (see any
 * *Entity id column) to avoid JS number precision loss. organizationId is
 * null for a BUYER (users.organization_id is always NULL for buyers, Part
 * 2.5's own CHECK) — vendor/platform users always have one, and only they
 * can meaningfully call catalog/inventory endpoints (a null organizationId
 * simply matches nothing, since every catalog/inventory query filters by
 * organization_id, so a buyer token is not privileged for these routes).
 *
 * roles is the caller's role codes (role.code, e.g. 'VENDOR_CHECKER',
 * 'ADMIN', 'BUYER') resolved from user_role at guard time — read once per
 * request rather than re-queried by every service that needs a role check
 * (ProductsService.review(), Part 2.11/2.12).
 */
export interface RequestContext {
  userId: string;
  organizationId: string | null;
  userType: 'PLATFORM' | 'VENDOR' | 'BUYER';
  roles: string[];
}

/**
 * Express Request narrowed to require `user` to satisfy RequestContext.
 * Controllers read `req.user` through this type instead of `any` so a
 * missing/malformed principal is a compile-time error, not a runtime one.
 */
export interface AuthenticatedRequest extends Request {
  user: RequestContext;
}

/**
 * Every catalog/inventory route requires a vendor/platform caller with a
 * real organizationId — a BUYER's is always null (see RequestContext doc
 * comment). Centralised here instead of repeated per controller so the
 * "not a vendor" case is rejected identically everywhere.
 */
export function requireOrganizationId(user: RequestContext): string {
  if (!user.organizationId) {
    throw new ForbiddenException('This action requires a vendor or platform account.');
  }
  return user.organizationId;
}
