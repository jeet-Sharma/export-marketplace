import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { MessagingService } from './messaging.service.js';
import { PublishMessageDto } from './dto/publish-message.dto.js';

/**
 * Manual publish endpoint for the SQS-backed messaging queue. Real producers
 * (order placed, RFQ submitted, export docs ready) call MessagingService
 * directly from their own services — this controller exists for ops/testing
 * and as a reference for how to publish a message.
 */
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('publish')
  async publish(@Body() dto: PublishMessageDto): Promise<{ messageId: string }> {
    if (!dto?.payload) {
      throw new BadRequestException('Request body must include a "payload" object.');
    }

    const messageId = await this.messagingService.sendMessage(dto.payload, dto.messageGroupId);
    return { messageId };
  }
}
