import { Module } from '@nestjs/common';
import { AwsClientsModule } from '../aws/aws-clients.module.js';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [AwsClientsModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
