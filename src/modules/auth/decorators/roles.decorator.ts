import { Reflector } from '@nestjs/core';

import { Role } from '@/common/enums/role.enum';

export const Roles = Reflector.createDecorator<Role[]>();
