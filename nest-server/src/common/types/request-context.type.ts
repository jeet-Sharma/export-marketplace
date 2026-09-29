import type { Request } from 'express';

/**
 * Shape of the authenticated principal this module expects to find on
 * `req.user`. This is a CONTRACT, not an implementation — authentication
 * (JWT verification, guards, decorators) is owned by another developer and
 * is intentionally not built here. Once that auth layer lands, req.user
 * just needs to satisfy this shape; nothing in catalog/inventory changes.
 *
 * userId / organizationId are the same values as users.id / users.organization_id
 * (Data_Modeling_Complete.md Part 2.5) — kept as strings because bigint
 * columns are mapped as strings throughout this codebase (see any
 * *Entity id column) to avoid JS number precision loss.
 */
export interface RequestContext {
  userId: string;
  organizationId: string;
}

/**
 * Express Request narrowed to require `user` to satisfy RequestContext.
 * Controllers read `req.user` through this type instead of `any` so a
 * missing/malformed principal is a compile-time error, not a runtime one.
 */
export interface AuthenticatedRequest extends Request {
  user: RequestContext;
}
