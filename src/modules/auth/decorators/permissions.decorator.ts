import { Reflector } from '@nestjs/core';

import { Permission } from '@/common/enums/permission.enum';

export const RequirePermissions = Reflector.createDecorator<Permission[]>();
