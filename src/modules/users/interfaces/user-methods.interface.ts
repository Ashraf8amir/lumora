import { SoftDeleteMethods } from '@/infrastructure/providers/mongoose/plugins/soft-delete.plugin';

export interface UserMethods<T> extends SoftDeleteMethods {
  verifyEmail(): Promise<T>;
  activate(): Promise<T>;
  deactivate(): Promise<T>;
  changeAvatar(url: string): Promise<T>;
}
