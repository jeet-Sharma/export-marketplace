import { Module } from '@nestjs/common';
import { AwsClientsModule } from '../aws/aws-clients.module.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [AwsClientsModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
