import { Injectable } from '@nestjs/common';

import { MessageIdempotencyRepository } from './message-idempotency.repository';
import { MessageProcessingStatus } from './message-idempotency.schema';
import { ClientSession } from 'mongoose';

@Injectable()
export class MessageIdempotencyService {
  private readonly processingTimeoutMs = 5 * 60 * 1000;

  constructor(private readonly repository: MessageIdempotencyRepository) {}

  async startProcessing(messageId: string, event: string): Promise<boolean> {
    const created = await this.repository.createProcessing(messageId, event);

    if (created) return true;

    const existing = await this.repository.findByMessageId(messageId);

    if (!existing) return false;

    if (existing.status === MessageProcessingStatus.COMPLETED) {
      return false;
    }

    const staleBefore = new Date(Date.now() - this.processingTimeoutMs);

    return this.repository.reclaimStaleProcessing(messageId, staleBefore);
  }

  async markCompleted(messageId: string, session: ClientSession): Promise<void> {
    await this.repository.markAsCompleted(messageId, session);
  }
}
