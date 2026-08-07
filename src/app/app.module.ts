import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@config/index';

@Module({
  imports: [ConfigurationModule],
})
export class AppModule {}
