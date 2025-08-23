// middleware/sanitize.js
import sanitizeHtml from 'sanitize-html';
import { check, validationResult } from 'express-validator';

// Sanitize request data
export const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    // Recursively sanitize all string values in the object
    const sanitizeRecursively = (obj) => {
      if (!obj) return obj;
      
      if (typeof obj === 'string') {
        return sanitizeHtml(obj, {
          allowedTags: [], // No tags allowed (strip all HTML)
          allowedAttributes: {} // No attributes allowed
        });
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeRecursively(item));
      }
      
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          result[key] = sanitizeRecursively(obj[key]);
        }
        return result;
      }
      
      return obj;
    };
    
    req.body = sanitizeRecursively(req.body);
  }
  
  next();
};

// Sanitize input validation middleware
export const validateInput = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  };
};

// Common validation rules
export const commonRules = {
  // String with max length and no HTML
  string: (field, maxLength = 255) => 
    check(field)
      .isString()
      .withMessage(`${field} deve essere una stringa`)
      .isLength({ max: maxLength })
      .withMessage(`${field} non può superare ${maxLength} caratteri`),
  
   // Email validation
 email: (field = 'email') =>
   check(field)
     .isEmail()
     .withMessage('Email non valida')
     .normalizeEmail(),
 
 // Numeric validation
 numeric: (field) => 
   check(field)
     .isNumeric()
     .withMessage(`${field} deve essere un numero`),
 
 // ObjectId validation
 objectId: (field) => 
   check(field)
     .isMongoId()
     .withMessage(`${field} deve essere un ID valido`),
 
 // Date validation
 date: (field) => 
   check(field)
     .isISO8601()
     .withMessage(`${field} deve essere una data valida`)
};