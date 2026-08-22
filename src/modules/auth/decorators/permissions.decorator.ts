import { SetMetadata } from '@nestjs/common';
import { Role } from '@/common/enums/role.enum';

export enum Permission {
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  ORDER_READ = 'order:read',
  ORDER_WRITE = 'order:write',
  ORDER_DELETE = 'order:delete',
  ADMIN_ACCESS = 'admin:access',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.ORDER_READ,
    Permission.ORDER_WRITE,
    Permission.ORDER_DELETE,
    Permission.ADMIN_ACCESS,
  ],
  [Role.CUSTOMER]: [Permission.ORDER_READ, Permission.ORDER_WRITE],
};

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
