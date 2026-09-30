import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Request body for POST /messaging/publish.
 *
 * class-validator decorators are required now that main.ts installs a global
 * ValidationPipe with whitelist + forbidNonWhitelisted: without them, the
 * pipe would strip every property off this DTO (payload/messageGroupId are
 * not "known" properties) and break the endpoint. `payload` is an arbitrary
 * JSON object, so it is validated as an object rather than by shape.
 */
export class PublishMessageDto {
  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  messageGroupId?: string;
}
