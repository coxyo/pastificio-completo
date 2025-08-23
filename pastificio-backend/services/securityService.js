// services/securityService.js
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import logger from '../config/logger.js';

// Generate secure random token
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Set up security middleware
export const setupSecurity = (app) => {
  // Helmet helps secure Express apps by setting HTTP headers
  app.use(helmet());
  
  // Enable CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Sanitize data (prevent NoSQL injection)
  app.use(mongoSanitize());
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp());
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }));
  }
  
  logger.info('Security middleware configured');
};

// Hash password with PBKDF2
export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

// Verify password
export const verifyPassword = (password, hash, salt) => {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
};

// Sanitize object (remove sensitive fields)
export const sanitizeObject = (obj, fields = ['password', 'hash', 'salt', 'token']) => {
  if (!obj) return obj;
  
  const sanitized = { ...obj };
  fields.forEach(field => {
    if (sanitized[field]) delete sanitized[field];
  });
  
  return sanitized;
};