import { INestApplication, Logger } from '@nestjs/common';

const SHUTDOWN_TIMEOUT_MS = 30_000;

export function setupGracefulShutdown(app: INestApplication): void {
  const logger = new Logger('Shutdown');

  const shutdown = (signal: string) => {
    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    const forceExitTimer = setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    app
      .close()
      .then(() => {
        clearTimeout(forceExitTimer);
        logger.log('Application closed gracefully.');
        process.exit(0);
      })
      .catch((error) => {
        clearTimeout(forceExitTimer);
        logger.error(`Error during application shutdown: ${error.message}`, error.stack);
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
