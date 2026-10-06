import { IsJWT, IsString } from 'class-validator';

/** Request body for POST /auth/refresh. */
export class RefreshTokenDto {
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
