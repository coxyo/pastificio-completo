// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import logger from '../config/logger.js';

// Create Redis client if needed
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    logger.info('Redis client initialized for rate limiting');
  }
} catch (error) {
  logger.error(`Failed to initialize Redis: ${error.message}`);
}

// Default limiter
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi'
  },
  // Use Redis if available
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    })
  })
});

// Authentication limiter - more strict
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Troppe richieste di autenticazione, riprova più tardi'
  },
  // Use Redis if available
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:auth:'
    })
  })
});

// API limiter
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Troppe richieste API, riprova più tardi'
  },
  // Use Redis if available
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:api:'
    })
  })
});