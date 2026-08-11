export const CACHE_TTL = {
  PRODUCT: 60 * 30,
  CATEGORY: 60 * 60 * 6,
  BRAND: 60 * 60 * 6,
  SETTINGS: 60 * 60 * 12,
  USER_PROFILE: 60 * 15,
  DASHBOARD_STATS: 60 * 5,
  OTP: 60 * 5,
  REFRESH_TOKEN: 60 * 60 * 24 * 30,
} as const;
