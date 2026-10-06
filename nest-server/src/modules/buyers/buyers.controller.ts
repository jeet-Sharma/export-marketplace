import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BuyersService } from './buyers.service.js';
import type { BuyerProfileResponseDto } from './dto/buyer-profile-response.dto.js';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto.js';

/**
 * Buyer self-service profile. Both routes are guarded by JwtAuthGuard and
 * act on the caller's OWN profile only — the user id comes from the verified
 * access token via @CurrentUser(), never from a path/param/body the client
 * controls (security-rules.md). There is intentionally no /buyers/:id here:
 * a buyer has no business reading another buyer by id.
 */
@UseGuards(JwtAuthGuard)
@Controller('buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<BuyerProfileResponseDto> {
    return this.buyersService.getMyProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBuyerProfileDto): Promise<BuyerProfileResponseDto> {
    return this.buyersService.updateMyProfile(user.id, dto);
  }
}
