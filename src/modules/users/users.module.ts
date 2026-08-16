import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Role } from '@/common/enums/role.enum';
import { CacheModule } from '@/infrastructure/cache/cache.module';

import { AdminSchema } from './schemas/discriminators/admin.schema';
import { CustomerSchema } from './schemas//discriminators/customer.schema';
import { StoreManagerSchema } from './schemas//discriminators/store-manager.schema';
import { TechnicianSchema } from './schemas//discriminators/technician.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
        discriminators: [
          { name: Role.CUSTOMER, schema: CustomerSchema },
          { name: Role.STORE_MANAGER, schema: StoreManagerSchema },
          { name: Role.TECHNICIAN, schema: TechnicianSchema },
          { name: Role.ADMIN, schema: AdminSchema },
        ],
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
