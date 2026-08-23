import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { Role } from '@/common/enums/role.enum';
import { Permission } from '@/common/enums/permission.enum';

export interface RoleRecord {
  name: Role;
  permissions: Permission[];
}

@Injectable()
export class RolesRepository {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async findByName(role: Role): Promise<RoleRecord | null> {
    return this.connection.collection<RoleRecord>('roles').findOne(
      { name: role },
      {
        projection: {
          _id: 0,
          name: 1,
          permissions: 1,
        },
      },
    );
  }
}
