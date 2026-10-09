import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { S3Service } from './s3.service.js';

interface UploadBody {
  key: string;
  content: string;
  contentType?: string;
}

/**
 * Demo endpoints for manually exercising the S3 integration against
 * LocalStack. These are intended for local verification and should be removed
 * or secured before production.
 *
 * Routes are mounted under /aws-demo.
 */
@Controller('aws-demo')
export class AwsDemoController {
  constructor(private readonly s3: S3Service) {}

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
}
