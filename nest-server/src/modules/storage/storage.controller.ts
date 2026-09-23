import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service.js';
import { UploadFileResponseDto } from './dto/upload-file-response.dto.js';

/**
 * File storage endpoints backed by S3 (LocalStack in dev). Used for
 * product images, export documents (invoice, packing list, certifications)
 * and any other buyer/vendor/admin upload.
 */
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided. Send it as multipart field "file".');
    }

    return this.storageService.uploadFile({
      body: file.buffer,
      fileName: file.originalname,
      contentType: file.mimetype,
      folder,
    });
  }

  // S3 keys contain slashes (e.g. "products/<uuid>-file.png"), so the key is
  // passed as a query param rather than a path segment to avoid ambiguous
  // route matching.
  @Get('download-url')
  async getDownloadUrl(@Query('key') key: string): Promise<{ url: string }> {
    if (!key) {
      throw new BadRequestException('Query parameter "key" is required.');
    }
    const url = await this.storageService.getSignedDownloadUrl(key);
    return { url };
  }

  @Delete()
  async remove(@Query('key') key: string): Promise<{ deleted: true }> {
    if (!key) {
      throw new BadRequestException('Query parameter "key" is required.');
    }
    await this.storageService.deleteFile(key);
    return { deleted: true };
  }
}
