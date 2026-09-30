/**
 * Claims carried by the access token (signed in AuthService.loginBuyer).
 * `sub` is the internal users.id; publicId/userType are convenience copies.
 */
export interface AccessTokenPayload {
  sub: string;
  publicId: string;
  userType: 'PLATFORM' | 'VENDOR' | 'BUYER';
  iat?: number;
  exp?: number;
}

/**
 * Claims carried by the refresh token (signed in AuthService.loginBuyer /
 * refreshTokens). `jti` is the random per-session secret whose SHA-256 hash
 * is stored in auth_session.refresh_token_hash; `sessionId` is that row's id.
 */
export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * The verified identity JwtAuthGuard attaches to the request and
 * @CurrentUser() returns. Derived entirely from the validated token +
 * a fresh DB status check — never from client-supplied body/params
 * (security-rules.md: scope must come from the authenticated session).
 */
export interface AuthenticatedUser {
  id: string;
  publicId: string;
  userType: 'PLATFORM' | 'VENDOR' | 'BUYER';
  email: string;
  /**
   * The vendor company this user belongs to — the tenant key that every
   * vendor-owned query must be scoped by. NULL for buyers (who have no
   * organization). Sourced from users.organization_id.
   */
  organizationId: string | null;
  /** Role codes granted to this user, e.g. ['VENDOR_OWNER'] or ['BUYER']. */
  roles: string[];
  /**
   * Resolved permission codes (union across the user's roles), e.g.
   * ['product.approve', 'order.accept']. Authorization checks should use
   * these — `permissions.includes('product.approve')` — never role names
   * (Data_Modeling_Complete.md A.9).
   */
  permissions: string[];
}
