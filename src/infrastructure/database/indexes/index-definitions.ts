import { IndexSpecification, CreateIndexesOptions } from 'mongodb';

export interface IndexDefinition {
  collection: string;
  spec: IndexSpecification;
  options?: CreateIndexesOptions;
}

export const INDEX_DEFINITIONS: IndexDefinition[] = [
  // ==================== USERS COLLECTION ====================
  {
    collection: 'users',
    spec: { email: 1 },
    options: { unique: true, name: 'idx_users_email_unique' },
  },
  {
    collection: 'users',
    spec: { isDeleted: 1, role: 1 },
    options: { name: 'idx_users_isDeleted_role' },
  },

  // ==================== PRODUCTS COLLECTION ====================
  {
    collection: 'products',
    spec: { slug: 1 },
    options: { unique: true, name: 'idx_products_slug_unique' },
  },
  {
    collection: 'products',
    spec: { categoryId: 1, price: 1 },
    options: { name: 'idx_products_category_price' },
  },
  {
    collection: 'products',
    spec: { name: 'text', description: 'text' },
    options: { name: 'idx_products_text_search' },
  },

  // ==================== ORDERS COLLECTION ====================
  {
    collection: 'orders',
    spec: { userId: 1, createdAt: -1 },
    options: { name: 'idx_orders_user_created' },
  },
  {
    collection: 'orders',
    spec: { status: 1 },
    options: { name: 'idx_orders_status' },
  },
];
