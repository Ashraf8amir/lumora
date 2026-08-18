export interface StoreManagerMethods<T> {
  enableManagement(): Promise<T>;
  disableManagement(): Promise<T>;
}
