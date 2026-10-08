import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@export-marketplace.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'ChangeMe123!',
    description: 'Plaintext password, never logged or stored.',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
