import { Role } from '@common/enums/role.enum';
import { Permission } from '@common/enums/permission.enum';

export const DEFAULT_ROLES = [
  {
    name: Role.ADMIN,
    permissions: Object.values(Permission),
  },
  {
    name: Role.STORE_MANAGER,
    permissions: [
      Permission.PROFILE_READ,
      Permission.PROFILE_WRITE,
      Permission.USERS_READ,
      Permission.PRODUCTS_READ,
      Permission.PRODUCTS_WRITE,
      Permission.PRODUCTS_DELETE,
      Permission.CATEGORIES_READ,
      Permission.CATEGORIES_WRITE,
      Permission.CATEGORIES_DELETE,
      Permission.ORDERS_READ_ALL,
      Permission.ORDERS_UPDATE_STATUS,
      Permission.INVENTORY_MANAGE,
      Permission.TICKETS_READ_ALL,
    ],
  },
  {
    name: Role.TECHNICIAN,
    permissions: [
      Permission.PROFILE_READ,
      Permission.PROFILE_WRITE,
      Permission.PRODUCTS_READ,
      Permission.TASKS_READ_ASSIGNED,
      Permission.TASKS_UPDATE_ASSIGNED,
      Permission.TICKETS_READ_ALL,
      Permission.TICKETS_UPDATE_STATUS,
    ],
  },
  {
    name: Role.CUSTOMER,
    permissions: [
      Permission.PROFILE_READ,
      Permission.PROFILE_WRITE,
      Permission.PRODUCTS_READ,
      Permission.CATEGORIES_READ,
      Permission.ORDERS_CREATE,
      Permission.ORDERS_READ_OWN,
      Permission.TICKETS_CREATE,
      Permission.TICKETS_READ_OWN,
    ],
  },
];
