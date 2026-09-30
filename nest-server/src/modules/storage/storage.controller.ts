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
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service.js';
import { UploadFileResponseDto } from './dto/upload-file-response.dto.js';

/**
 * File storage endpoints backed by S3 (LocalStack in dev). Used for
 * product images, export documents (invoice, packing list, certifications)
 * and any other buyer/vendor/admin upload.
 */
@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file to S3 storage.' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Optional folder/prefix to store the file under.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.', type: UploadFileResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided.' })
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
  @ApiOperation({ summary: 'Get a signed, time-limited download URL for a stored file.' })
  @ApiQuery({ name: 'key', required: true, description: 'S3 object key of the file.' })
  @ApiResponse({ status: 200, description: 'Signed URL generated successfully.' })
  @ApiResponse({ status: 400, description: 'Query parameter "key" is missing.' })
  async getDownloadUrl(@Query('key') key: string): Promise<{ url: string }> {
    if (!key) {
      throw new BadRequestException('Query parameter "key" is required.');
    }
    const url = await this.storageService.getSignedDownloadUrl(key);
    return { url };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a stored file from S3.' })
  @ApiQuery({ name: 'key', required: true, description: 'S3 object key of the file to delete.' })
  @ApiResponse({ status: 200, description: 'File deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Query parameter "key" is missing.' })
  async remove(@Query('key') key: string): Promise<{ deleted: true }> {
    if (!key) {
      throw new BadRequestException('Query parameter "key" is required.');
    }
    await this.storageService.deleteFile(key);
    return { deleted: true };
  }
}
