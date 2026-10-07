// Shape of the authenticated-user payload returned alongside the access
// token on login, per Phase-1-API-Specification-v0.1 section 5.1. The
// refresh token is deliberately not part of this body — it's set as an
// HTTP-only secure cookie instead (see AuthController.login).
export class LoginResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
  };
}
