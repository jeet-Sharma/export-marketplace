import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterBuyerResponseDto } from './dto/register-buyer-response.dto.js';
import { RegisterBuyerDto } from './dto/register-buyer.dto.js';

/**
 * Buyer-facing auth endpoints. Only registration exists so far — see
 * AuthModule's doc comment for what's deliberately not built yet (login,
 * email verification, sessions).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterBuyerDto): Promise<RegisterBuyerResponseDto> {
    return this.authService.registerBuyer(dto);
  }
}
