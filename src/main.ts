import { Logger } from '@nestjs/common';
import { bootstrap } from './app/bootstrap';

async function main() {
  const app = await bootstrap();
  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  new Logger('Bootstrap').log(
    `Server running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`,
  );
}

main().catch((error) => {
  new Logger('Bootstrap').error('Error during bootstrap', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  new Logger('UnhandledRejection').error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  new Logger('UncaughtException').error(error.message, error.stack);
  process.exit(1);
});
