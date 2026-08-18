export enum Permission {
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',

  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
  ROLES_READ = 'roles:read',
  ROLES_WRITE = 'roles:write',

  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',
  CATEGORIES_READ = 'categories:read',
  CATEGORIES_WRITE = 'categories:write',
  CATEGORIES_DELETE = 'categories:delete',

  ORDERS_CREATE = 'orders:create',
  ORDERS_READ_OWN = 'orders:read_own',
  ORDERS_READ_ALL = 'orders:read_all',
  ORDERS_UPDATE_STATUS = 'orders:update_status',
  INVENTORY_MANAGE = 'inventory:manage',

  TICKETS_CREATE = 'tickets:create',
  TICKETS_READ_OWN = 'tickets:read_own',
  TICKETS_READ_ALL = 'tickets:read_all',
  TICKETS_UPDATE_STATUS = 'tickets:update_status',
  TASKS_READ_ASSIGNED = 'tasks:read_assigned',
  TASKS_UPDATE_ASSIGNED = 'tasks:update_assigned',
}
