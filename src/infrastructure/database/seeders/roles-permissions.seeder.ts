import { DEFAULT_ROLES } from '@modules/auth/constants/roles-permissions.constant';
import { Connection } from 'mongoose';

export function createRolesSeeder(connection: Connection) {
  return {
    name: 'roles-permissions-seeder',
    async run() {
      const rolesCollection = connection.collection('roles');
      for (const role of DEFAULT_ROLES) {
        await rolesCollection.updateOne({ name: role.name }, { $set: role }, { upsert: true });
      }
    },
  };
}
