import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Request body for POST /auth/login (buyer only). */
export class LoginDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;
}
