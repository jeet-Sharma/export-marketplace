import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Body for POST /messaging/publish.
 *
 * Decorated with class-validator (now installed for AuthModule's DTOs —
 * see register-buyer.dto.ts) so this class isn't "empty" from
 * ValidationPipe's perspective. main.ts's global pipe runs with
 * whitelist + forbidNonWhitelisted for every controller: a plain,
 * undecorated class has no recognized properties, so every field on an
 * otherwise-valid request body would be stripped/rejected as
 * non-whitelisted before this controller ever ran.
 */
export class PublishMessageDto {
  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  messageGroupId?: string;
}
