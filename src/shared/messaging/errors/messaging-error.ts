export abstract class MessagingError extends Error {
  abstract readonly retryable: boolean;

  protected constructor(message: string) {
    super(message);

    this.name = this.constructor.name;
  }
}
