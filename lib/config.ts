export const config = {
  features: {
    telegram: false,
    ai: false,
    vectorSearch: false,
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mediasyndicate',
  },
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
} as const;
