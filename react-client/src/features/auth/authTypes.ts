/** Authenticated user payload returned by POST /auth/login (section 5.1). */
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};
