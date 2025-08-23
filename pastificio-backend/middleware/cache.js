// middleware/cache.js
import NodeCache from 'node-cache';
import Redis from 'ioredis';
import logger from '../config/logger.js';

// Default TTL: 5 minutes
const DEFAULT_TTL = 300;

// Initialize cache (Redis if available, otherwise in-memory)
let cache;
try {
  if (process.env.REDIS_URL) {
    // Use Redis for distributed caching
    cache = new Redis(process.env.REDIS_URL);
    logger.info('Redis cache initialized');
  } else {
    // Fallback to in-memory cache
    cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 120
    });
    logger.info('In-memory cache initialized');
  }
} catch (error) {
  logger.error(`Failed to initialize cache: ${error.message}`);
  // Fallback to in-memory cache
  cache = new NodeCache({
    stdTTL: DEFAULT_TTL,
    checkperiod: 120
  });
}

// Redis methods
const redisGet = async (key) => {
  try {
    const value = await cache.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Redis GET error: ${err.message}`);
    return null;
  }
};

const redisSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await cache.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (err) {
    logger.error(`Redis SET error: ${err.message}`);
    return false;
  }
};

const redisDelete = async (key) => {
  try {
    await cache.del(key);
    return true;
  } catch (err) {
    logger.error(`Redis DELETE error: ${err.message}`);
    return false;
  }
};

// Node-cache methods
const memGet = (key) => {
  try {
    return cache.get(key);
  } catch (err) {
    logger.error(`Cache GET error: ${err.message}`);
    return null;
  }
};

const memSet = (key, value, ttl = DEFAULT_TTL) => {
  try {
    return cache.set(key, value, ttl);
  } catch (err) {
    logger.error(`Cache SET error: ${err.message}`);
    return false;
  }
};

const memDelete = (key) => {
  try {
    return cache.del(key);
  } catch (err) {
    logger.error(`Cache DELETE error: ${err.message}`);
    return false;
  }
};

// Determine if we're using Redis or in-memory cache
const isRedis = cache instanceof Redis;

// Unified cache methods
export const cacheGet = isRedis ? redisGet : memGet;
export const cacheSet = isRedis ? redisSet : memSet;
export const cacheDelete = isRedis ? redisDelete : memDelete;

// Cache key generator
export const generateCacheKey = (req) => {
  const path = req.originalUrl || req.url;
  const userId = req.user ? req.user.id : 'guest';
  return `${userId}:${path}`;
};

// Route caching middleware
export const cacheRoute = (ttl = DEFAULT_TTL) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = generateCacheKey(req);
    
    try {
      // Try to get from cache
      const cachedData = await cacheGet(key);
      
      if (cachedData) {
        return res.status(200).json({
          ...cachedData,
          _cached: true
        });
      }
      
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to cache response
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            let data = body;
            if (typeof body === 'string') {
              data = JSON.parse(body);
            }
            
            // Don't cache error responses
            if (data.success !== false) {
              cacheSet(key, data, ttl);
            }
          } catch (err) {
            logger.error(`Cache middleware error: ${err.message}`);
          }
        }
        
        // Call original send method
        originalSend.call(this, body);
      };
      
      next();
    } catch (err) {
      logger.error(`Cache middleware error: ${err.message}`);
      next();
    }
  };
};

// Clear cache for specific patterns
export const clearCache = async (pattern) => {
  try {
    if (isRedis) {
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(keys);
        logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
      }
    } else {
      // For in-memory cache, we'll need to match keys manually
      const keys = cache.keys();
      const matchingKeys = keys.filter(key => 
        key.includes(pattern) || 
        new RegExp(pattern.replace('*', '.*')).test(key)
      );
      
      if (matchingKeys.length > 0) {
        cache.del(matchingKeys);
        logger.info(`Cleared ${matchingKeys.length} cache keys matching: ${pattern}`);
      }
    }
    return true;
  } catch (err) {
    logger.error(`Error clearing cache: ${err.message}`);
    return false;
  }
};