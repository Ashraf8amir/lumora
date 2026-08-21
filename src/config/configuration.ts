export default () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appName: process.env.APP_NAME ?? 'Lumora',
  },

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  database: {
    uri: process.env.DATABASE_URI,
    retryAttempts: Number(process.env.DATABASE_RETRY_ATTEMPTS) || 3,
    retryDelay: Number(process.env.DATABASE_RETRY_DELAY) || 3000,
    maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE) || 15,
    minPoolSize: Number(process.env.DATABASE_MIN_POOL_SIZE) || 3,
    serverSelectionTimeoutMS: Number(process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS) || 10000,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB) || 0,
  },

  swagger: {
    enabledInProduction: process.env.SWAGGER_ENABLE_IN_PROD === 'true',
    basicAuthUser: process.env.SWAGGER_USERNAME,
    basicAuthPassword: process.env.SWAGGER_PASSWORD,
  },

  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    },

    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },

    mfaChallenge: {
      secret: process.env.JWT_MFA_CHALLENGE_SECRET,
      expiration: process.env.JWT_MFA_CHALLENGE_EXPIRATION || '5m',
    },
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
