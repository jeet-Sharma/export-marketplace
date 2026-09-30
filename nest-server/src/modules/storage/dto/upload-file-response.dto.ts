import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ description: 'S3 object key the file was stored under.' })
  key!: string;

  @ApiProperty({ description: 'S3 bucket the file was stored in.' })
  bucket!: string;
}
