export const RABBITMQ_EXCHANGES = {
  EVENTS: 'app.events',
  RETRY: 'app.retry',
} as const;

export const RABBITMQ_QUEUES = {
  USER_CREATED: 'user.created.queue',

  USER_CREATED_RETRY_5S: 'user.created.retry.5s',
  USER_CREATED_RETRY_30S: 'user.created.retry.30s',
  USER_CREATED_RETRY_5M: 'user.created.retry.5m',
} as const;
