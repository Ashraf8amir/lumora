export class CacheKeys {
  static product(id: string): string {
    return `product:${id}`;
  }

  static productList(page: number): string {
    return `product:list:${page}`;
  }

  static category(id: string): string {
    return `category:${id}`;
  }

  static categoryList(): string {
    return `category:list`;
  }

  static brand(id: string): string {
    return `brand:${id}`;
  }

  static brandList(): string {
    return `brand:list`;
  }

  static customer(id: string): string {
    return `customer:${id}`;
  }

  static userProfile(id: string): string {
    return `user:${id}:profile`;
  }

  static orderSummary(id: string): string {
    return `order:summary:${id}`;
  }

  static settingsGeneral(): string {
    return `settings:general`;
  }

  static dashboardStats(): string {
    return `dashboard:stats`;
  }

  static twoFactorSetup(userId: string): string {
    return `2fa:setup:${userId}`;
  }
}
