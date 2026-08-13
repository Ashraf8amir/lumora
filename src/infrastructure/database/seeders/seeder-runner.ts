import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '@app/app.module';

import { createRolesSeeder } from './roles-permissions.seeder';

async function runSeeders() {
  console.log('[Seeder Runner] Starting database seeding process...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());

    const seeders = [createRolesSeeder(connection)];

    for (const seeder of seeders) {
      console.log(`Executing: [${seeder.name}]...`);
      const startTime = Date.now();

      await seeder.run();

      const duration = Date.now() - startTime;
      console.log(`Finished: [${seeder.name}] (${duration}ms)`);
    }

    console.log('[Seeder Runner] All seeders executed successfully!');
  } catch (error) {
    console.error('[Seeder Runner] Failed to complete seeding:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

runSeeders();
