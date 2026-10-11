import type { Request, Response, NextFunction } from "express";

/**
 * GDG Ranchi DevFest 2026 - Security Input Sanitization Middleware
 * Protects against:
 * 1. Prototype Pollution (__proto__, constructor, prototype)
 * 2. Null Byte Injection (\0, %00)
 * 3. Malicious characters in query strings and JSON payloads
 */

const sanitizeValue = (val: any): any => {
  if (typeof val === "string") {
    // Strip null byte characters that could bypass file/string boundary checks
    return val.replace(/\0/g, "");
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === "object") {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(val)) {
      // Disallow dangerous prototype pollution properties
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      cleanObj[key] = sanitizeValue(value);
    }
    return cleanObj;
  }
  return val;
};

/**
 * Sanitizes incoming request body, query parameters, and URL path params
 */
export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeValue(req.params);
    }
  } catch {
    // Fail-safe: continue execution
  }
  next();
};

export default sanitizeInputs;
