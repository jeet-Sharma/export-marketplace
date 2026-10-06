import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import type { BuyerProfileResponseDto } from './dto/buyer-profile-response.dto.js';
import type { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto.js';

/**
 * Buyer self-service profile (GET/PATCH /buyers/me).
 *
 * Every method is scoped by the authenticated user id the controller passes
 * from @CurrentUser() — never a client-supplied id. A buyer can therefore
 * only ever read or modify their OWN profile, which is the buyer-side half
 * of the data-isolation golden rule (marketplace-domain.md: buyer data is
 * scoped by user_id, taken from the verified session).
 */
@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(private readonly dataSource: DataSource) {}

  /** Read the authenticated buyer's own profile. */
  async getMyProfile(userId: string): Promise<BuyerProfileResponseDto> {
    const user = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    // The guard already confirmed the user exists and is ACTIVE, so a miss
    // here is an unexpected state, not normal input.
    if (!user) {
      throw new NotFoundException('Profile not found.');
    }
    this.assertBuyer(user);

    const profile = await this.dataSource
      .getRepository(BuyerProfileEntity)
      .createQueryBuilder('profile')
      .where('profile.userId = :userId', { userId })
      .getOne();
    if (!profile) {
      // A BUYER users row without its buyer_profile means a broken/partial
      // registration — surfaced as a clean 500, not a confusing 404.
      this.logger.error(`Buyer ${userId} has a users row but no buyer_profile.`);
      throw new InternalServerErrorException('Profile is unavailable.');
    }

    return this.toResponse(user, profile);
  }

  /**
   * Update the authenticated buyer's own profile. Only the fields present in
   * the DTO are changed. Runs in a transaction that locks the user row first
   * (the consistent lock-order root used across the auth flows), so a
   * concurrent update of the same profile serialises rather than racing.
   */
  async updateMyProfile(userId: string, dto: UpdateBuyerProfileDto): Promise<BuyerProfileResponseDto> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager
          .getRepository(UserEntity)
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :userId', { userId })
          .getOne();
        if (!user) {
          throw new NotFoundException('Profile not found.');
        }
        this.assertBuyer(user);

        const profile = await manager
          .getRepository(BuyerProfileEntity)
          .createQueryBuilder('profile')
          .setLock('pessimistic_write')
          .where('profile.userId = :userId', { userId })
          .getOne();
        if (!profile) {
          this.logger.error(`Buyer ${userId} has a users row but no buyer_profile.`);
          throw new InternalServerErrorException('Profile is unavailable.');
        }

        // Apply user-row fields.
        if (dto.fullName !== undefined) {
          user.fullName = dto.fullName;
        }
        if (dto.phone !== undefined) {
          user.phone = dto.phone;
        }

        // Apply profile fields.
        if (dto.buyerType !== undefined) {
          profile.buyerType = dto.buyerType;
        }
        if (dto.companyName !== undefined) {
          profile.companyName = dto.companyName;
        }
        if (dto.country !== undefined) {
          profile.country = dto.country;
        }
        if (dto.preferredCurrency !== undefined) {
          profile.preferredCurrency = dto.preferredCurrency;
        }
        if (dto.preferredLanguage !== undefined) {
          profile.preferredLanguage = dto.preferredLanguage;
        }

        // Cross-field invariant, checked against the MERGED state (the DB has
        // the same CHECK, but validating here returns a clean 400 with a
        // useful message instead of a raw constraint error). A BUSINESS buyer
        // must have a non-empty company name — whether buyerType was just
        // changed to BUSINESS or was already BUSINESS and companyName is being
        // cleared, both are caught.
        if (profile.buyerType === 'BUSINESS' && !profile.companyName?.trim()) {
          throw new BadRequestException('A business buyer must have a company name.');
        }

        await manager.getRepository(UserEntity).save(user);
        await manager.getRepository(BuyerProfileEntity).save(profile);

        return this.toResponse(user, profile);
      });
    } catch (error) {
      // A FK violation means country/preferredCurrency passed format
      // validation but isn't a known reference code (the reference tables are
      // unseeded today) — clean 400 rather than leaking the Postgres error.
      if (error instanceof QueryFailedError && (error as { code?: string }).code === '23503') {
        throw new BadRequestException('The provided country or currency code is not supported.');
      }
      throw error;
    }
  }

  /** Only BUYER users have a buyer profile; platform/vendor users get 403. */
  private assertBuyer(user: UserEntity): void {
    if (user.userType !== 'BUYER') {
      throw new ForbiddenException('Only buyer accounts have a buyer profile.');
    }
  }

  private toResponse(user: UserEntity, profile: BuyerProfileEntity): BuyerProfileResponseDto {
    return {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      buyerType: profile.buyerType,
      companyName: profile.companyName,
      country: profile.country,
      preferredCurrency: profile.preferredCurrency,
      preferredLanguage: profile.preferredLanguage,
      isVerified: profile.isVerified,
    };
  }
}
