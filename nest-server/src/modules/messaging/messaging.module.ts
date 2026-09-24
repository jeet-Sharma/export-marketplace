import { Module } from '@nestjs/common';
import { AwsClientsModule } from '../aws/aws-clients.module.js';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';

@Module({
  imports: [AwsClientsModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
