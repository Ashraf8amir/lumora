import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from '@/common/middlewares/logger.middleware';
import { GlobalModule } from './global.module';
import { AppStartupService } from './lifecycle/app-startup.service';
import { globalProviders } from './providers';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [GlobalModule, UsersModule],
  providers: [...globalProviders, AppStartupService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('{*path}');
  }
}
