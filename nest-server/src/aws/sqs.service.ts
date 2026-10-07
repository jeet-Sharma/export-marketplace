import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  DeleteMessageCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { awsConfig } from '../config/aws.config.js';
import { SQS_CLIENT } from './aws.constants.js';

export interface ReceivedMessage {
  messageId?: string;
  receiptHandle?: string;
  body: unknown;
}

/**
 * Thin wrapper around the SQS client for publishing and consuming marketplace
 * events. The queue URL is resolved lazily and cached on first use.
 */
@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private readonly queueName: string;
  private cachedQueueUrl?: string;

  constructor(
    @Inject(SQS_CLIENT) private readonly client: SQSClient,
    @Inject(awsConfig.KEY) private readonly config: ConfigType<typeof awsConfig>,
  ) {
    this.queueName = this.config.sqs.queueName;
  }

  /** Resolves and caches the queue URL from its name. */
  async getQueueUrl(): Promise<string> {
    if (this.cachedQueueUrl) {
      return this.cachedQueueUrl;
    }
    const result = await this.client.send(
      new GetQueueUrlCommand({ QueueName: this.queueName }),
    );
    if (!result.QueueUrl) {
      throw new Error(`Queue "${this.queueName}" not found`);
    }
    this.cachedQueueUrl = result.QueueUrl;
    return this.cachedQueueUrl;
  }

  /**
   * Sends a message. Objects are JSON-serialized; strings are sent as-is.
   * Returns the SQS message id.
   */
  async send(payload: unknown): Promise<{ messageId?: string }> {
    const queueUrl = await this.getQueueUrl();
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const result = await this.client.send(
      new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body }),
    );
    this.logger.log(`Sent message ${result.MessageId} to ${this.queueName}`);
    return { messageId: result.MessageId };
  }

  /**
   * Receives up to `maxMessages` messages. JSON bodies are parsed; non-JSON
   * bodies are returned as raw strings.
   */
  async receive(
    maxMessages = 1,
    waitTimeSeconds = 1,
  ): Promise<ReceivedMessage[]> {
    const queueUrl = await this.getQueueUrl();
    const result = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(Math.max(maxMessages, 1), 10),
        WaitTimeSeconds: waitTimeSeconds,
      }),
    );
    return (result.Messages ?? []).map((message) => ({
      messageId: message.MessageId,
      receiptHandle: message.ReceiptHandle,
      body: this.parseBody(message.Body),
    }));
  }

  /** Deletes a processed message using its receipt handle. */
  async delete(receiptHandle: string): Promise<void> {
    const queueUrl = await this.getQueueUrl();
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }

  private parseBody(body?: string): unknown {
    if (!body) {
      return null;
    }
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
}
