import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { S3Service } from './s3.service.js';
import { SqsService } from './sqs.service.js';
import { AwsDemoGuard } from './aws-demo.guard.js';

interface UploadBody {
  key: string;
  content: string;
  contentType?: string;
}

interface SendMessageBody {
  [key: string]: unknown;
}

/**
 * Demo endpoints for manually exercising the S3 and SQS integration against
 * LocalStack. These are intended for local verification only.
 *
 * The controller is always registered, but every route is gated by
 * AwsDemoGuard, which allows access only when demo routes are enabled in
 * config (ENABLE_AWS_DEMO_ROUTES=true AND a local AWS endpoint). When
 * disabled, the guard returns 404 so the routes are invisible in production.
 * Gating at request time (via ConfigService) avoids the import-time
 * process.env evaluation bug where a flag set only in .env was ignored.
 *
 * Routes are mounted under /aws-demo.
 */
@UseGuards(AwsDemoGuard)
@Controller('aws-demo')
export class AwsDemoController {
  constructor(
    private readonly s3: S3Service,
    private readonly sqs: SqsService,
  ) { }

  // ─── S3 ─────────────────────────────────────────────────────────────────────

  /** Uploads a text object. Body: { key, content, contentType? } */
  @Post('s3/objects')
  async uploadObject(@Body() body: UploadBody) {
    const result = await this.s3.upload({
      key: body.key,
      body: body.content,
      contentType: body.contentType ?? 'text/plain',
    });
    return { uploaded: result.key };
  }

  /** Lists stored objects, optionally filtered by ?prefix=. */
  @Get('s3/objects')
  async listObjects(@Query('prefix') prefix?: string) {
    return { objects: await this.s3.list(prefix) };
  }

  /** Returns an object's text content. */
  @Get('s3/objects/:key')
  async getObject(@Param('key') key: string) {
    const data = await this.s3.getObject(key);
    if (data === null) {
      throw new NotFoundException(`Object "${key}" not found`);
    }
    return { key, content: data.toString('utf-8') };
  }

  /** Returns a presigned download URL for an object. */
  @Get('s3/objects/:key/url')
  async getPresignedUrl(@Param('key') key: string) {
    return { url: await this.s3.getPresignedDownloadUrl(key) };
  }

  /** Deletes an object. */
  @Delete('s3/objects/:key')
  async deleteObject(@Param('key') key: string) {
    await this.s3.delete(key);
    return { deleted: key };
  }

  // ─── SQS ────────────────────────────────────────────────────────────────────

  /** Sends a JSON message to the queue. */
  @Post('sqs/messages')
  async sendMessage(@Body() body: SendMessageBody) {
    return this.sqs.send(body);
  }

  /** Receives messages. Query: ?max=1..10&wait=0..20 (long-poll seconds). */
  @Get('sqs/messages')
  async receiveMessages(
    @Query('max') max?: string,
    @Query('wait') wait?: string,
  ) {
    const messages = await this.sqs.receive(
      max ? Number(max) : 1,
      wait ? Number(wait) : 1,
    );
    return { messages };
  }

  /** Deletes a processed message by its receipt handle. */
  @Delete('sqs/messages/:receiptHandle')
  async deleteMessage(@Param('receiptHandle') receiptHandle: string) {
    await this.sqs.delete(decodeURIComponent(receiptHandle));
    return { deleted: true };
  }
}
