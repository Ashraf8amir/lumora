import { EVENTS } from '@/shared/messaging/event.types';
import { ROUTING_KEYS } from '@/shared/messaging/routing-keys';

export const RABBITMQ_EXCHANGES = {
  EVENTS: 'app.events',
  RETRY: 'app.retry',
  DLX: 'app.dlx',
} as const;

export const RABBITMQ_QUEUES = {
  USER_CREATED: 'user.created.queue',

  USER_CREATED_RETRY_5S: 'user.created.retry.5s',
  USER_CREATED_RETRY_30S: 'user.created.retry.30s',
  USER_CREATED_RETRY_5M: 'user.created.retry.5m',

  USER_CREATED_DLQ: 'user.created.dlq',
} as const;

export const RABBITMQ_RETRY_ROUTES: Record<string, Record<number, string>> = {
  [EVENTS.USER_CREATED]: {
    2: ROUTING_KEYS.USER_CREATED_RETRY_5S,
    3: ROUTING_KEYS.USER_CREATED_RETRY_30S,
    4: ROUTING_KEYS.USER_CREATED_RETRY_5M,
  },
};
