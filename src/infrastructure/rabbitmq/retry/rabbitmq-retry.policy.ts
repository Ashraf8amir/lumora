import { RABBITMQ_RETRY_ROUTES } from '../rabbitmq.constants';

export interface RetryDecision {
  shouldRetry: boolean;
  nextAttempt?: number;
  routingKey?: string;
}

export class RabbitMqRetryPolicy {
  decide(event: string, currentAttempt: number): RetryDecision {
    const nextAttempt = currentAttempt + 1;

    const routes = RABBITMQ_RETRY_ROUTES[event];

    if (!routes) {
      return {
        shouldRetry: false,
      };
    }

    const routingKey = routes[nextAttempt];

    if (!routingKey) {
      return {
        shouldRetry: false,
      };
    }

    return {
      shouldRetry: true,
      nextAttempt,
      routingKey,
    };
  }
}
