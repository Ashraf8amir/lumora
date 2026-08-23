import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequirePermissions } from '../decorators/permissions.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { RolesRepository } from '../repositories/roles.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(RequirePermissions, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) throw new ForbiddenException('User role is missing');

    const role = await this.rolesRepository.findByName(user.role);

    if (!role) throw new ForbiddenException('User role is invalid');

    const hasAllPermissions = requiredPermissions.every((permission) =>
      role.permissions.includes(permission),
    );

    if (!hasAllPermissions) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
