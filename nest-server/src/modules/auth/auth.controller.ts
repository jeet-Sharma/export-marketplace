import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterBuyerResponseDto } from './dto/register-buyer-response.dto.js';
import { RegisterBuyerDto } from './dto/register-buyer.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

/**
 * Buyer-facing auth endpoints. Registration, email verification, resend
 * verification, and login exist so far — session refresh/logout and request
 * guards remain separate endpoints.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.loginBuyer(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterBuyerDto): Promise<RegisterBuyerResponseDto> {
    return this.authService.registerBuyer(dto);
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto.token);
  }
}
