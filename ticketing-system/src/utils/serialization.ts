import { z } from 'zod';

/**
 * Serializes a domain object to JSON with proper date handling
 * Dates are serialized to ISO 8601 format with timezone information
 */
export function serialize<T>(obj: T): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

/**
 * Deserializes JSON to a domain object with proper date parsing
 */
export function deserialize<T>(json: string, dateFields: string[] = []): T {
  const obj = JSON.parse(json);
  
  // Convert date strings back to Date objects
  for (const field of dateFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      obj[field] = new Date(obj[field]);
    }
  }
  
  // Handle nested objects with dates
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item: any) => {
          if (typeof item === 'object') {
            return deserializeObject(item, dateFields);
          }
          return item;
        });
      } else {
        obj[key] = deserializeObject(obj[key], dateFields);
      }
    }
  }
  
  return obj as T;
}

function deserializeObject(obj: any, dateFields: string[]): any {
  for (const field of dateFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      obj[field] = new Date(obj[field]);
    }
  }
  
  // Common date field names
  const commonDateFields = ['createdAt', 'updatedAt', 'resolvedAt', 'timestamp', 'assignedAt', 'analyzedAt', 'breachedAt', 'tokenExpiry'];
  for (const field of commonDateFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      obj[field] = new Date(obj[field]);
    }
  }
  
  return obj;
}

/**
 * Validates JSON against a schema and returns descriptive errors
 */
export function validateJSON<T>(json: string, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const obj = JSON.parse(json);
    const result = schema.safeParse(obj);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, errors: [`JSON parsing failed: ${error.message}`] };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Checks if a date string is in ISO 8601 format with timezone
 */
export function isISO8601WithTimezone(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return iso8601Regex.test(dateString);
}

/**
 * Round-trip test: serialize then deserialize should produce equivalent object
 */
export function roundTrip<T>(obj: T, dateFields: string[] = []): T {
  const json = serialize(obj);
  return deserialize<T>(json, dateFields);
}
