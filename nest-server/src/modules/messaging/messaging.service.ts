import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateQueueCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  type Message,
  SQSClient,
} from '@aws-sdk/client-sqs';
import type { AwsConfig } from '../../config/aws.config.js';
import { SQS_CLIENT } from '../aws/aws-clients.tokens.js';

export interface ReceivedMessage<T = unknown> {
  id: string;
  receiptHandle: string;
  body: T;
}

/**
 * Thin wrapper around the SQS SDK for async messaging (order events, RFQ
 * notifications, export document generation jobs, etc). Resolves the queue
 * URL once on startup so callers only ever deal with the queue name.
 */
@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);
  private readonly queueName: string;
  private queueUrl = '';
  /**
   * False until the queue URL has been resolved. Kept false (rather than
   * throwing) when SQS/LocalStack is unreachable at boot, so a missing
   * LocalStack container degrades this module only, instead of crashing the
   * whole Nest app and every unrelated route with it.
   */
  private available = false;

  constructor(
    @Inject(SQS_CLIENT) private readonly sqsClient: SQSClient,
    private readonly configService: ConfigService,
  ) {
    this.queueName = this.configService.get<AwsConfig>('aws')!.sqs.queueName;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.queueUrl = await this.resolveQueueUrl();
      this.available = true;
    } catch (error) {
      this.logger.warn(
        `SQS/LocalStack unreachable at startup — messaging is disabled until it is. ` +
        `Run "npm run localstack:up" and restart the API to enable it. (${(error as Error).message})`,
      );
    }
  }

  private assertAvailable(): void {
    if (!this.available) {
      throw new ServiceUnavailableException(
        'Messaging is unavailable right now. Make sure LocalStack (dev) or AWS SQS (prod) is reachable.',
      );
    }
  }

  async sendMessage<T>(payload: T, messageGroupId?: string): Promise<string> {
    this.assertAvailable();
    const result = await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
        MessageGroupId: messageGroupId,
      }),
    );

    this.logger.log(`Sent message ${result.MessageId} to ${this.queueName}`);
    return result.MessageId!;
  }

  async receiveMessages<T = unknown>(maxMessages = 10): Promise<ReceivedMessage<T>[]> {
    this.assertAvailable();
    const result = await this.sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 1,
      }),
    );

    return (result.Messages ?? []).map((message: Message) => ({
      id: message.MessageId!,
      receiptHandle: message.ReceiptHandle!,
      body: JSON.parse(message.Body ?? '{}') as T,
    }));
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    this.assertAvailable();
    await this.sqsClient.send(
      new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle }),
    );
  }

  /**
   * Looks up the queue URL, creating the queue first if it does not exist
   * yet (always true on a fresh LocalStack container; a no-op against real
   * AWS once the queue has been provisioned there).
   */
  private async resolveQueueUrl(): Promise<string> {
    try {
      const { QueueUrl } = await this.sqsClient.send(
        new GetQueueUrlCommand({ QueueName: this.queueName }),
      );
      return QueueUrl!;
    } catch {
      this.logger.warn(`Queue "${this.queueName}" not found, creating it`);
      const { QueueUrl } = await this.sqsClient.send(
        new CreateQueueCommand({ QueueName: this.queueName }),
      );
      return QueueUrl!;
    }
  }
}
