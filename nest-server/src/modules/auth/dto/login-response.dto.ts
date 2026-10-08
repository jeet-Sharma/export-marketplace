import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ type: [String], example: ['PLATFORM_ADMIN'] })
  roles!: string[];

  @ApiProperty({
    type: [String],
    example: [
      'product.view',
      'product.create',
      'product.edit',
      'product.publish',
      'product.unpublish',
    ],
  })
  permissions!: string[];
}

// Shape of the authenticated-user payload returned alongside the access
// token on login, per Phase-1-API-Specification-v0.1 section 5.1. The
// refresh token is deliberately not part of this body — it's set as an
// HTTP-only secure cookie instead (see AuthController.login).
export class LoginResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (Bearer).' })
  accessToken!: string;

  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;
}
