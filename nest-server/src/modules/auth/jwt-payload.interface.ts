export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}
