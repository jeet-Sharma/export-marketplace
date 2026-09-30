import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Kept as a plain typed class (no class-validator) since that library isn't
// installed in this project yet. Add it separately if request validation
// needs to be enforced across the API, not just for this endpoint.
export class PublishMessageDto {
  @ApiProperty({
    description: 'Arbitrary JSON payload to publish to the queue.',
    type: 'object',
    additionalProperties: true,
  })
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'FIFO message group id, if the target queue requires one.',
  })
  messageGroupId?: string;
}
