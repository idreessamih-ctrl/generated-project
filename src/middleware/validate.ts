import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/types';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export const validate = (schemas: ValidationSchemas, options?: ValidationOptions) => {
  const {
    stripUnknown = true,
    abortEarly = false,
  } = options || {};

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const errors: Array<{ field: string; path: string; message: string }> = [];

      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const validationErrors = formatZodError(result.error, 'body');
          errors.push(...validationErrors);
        } else if (stripUnknown) {
          (req as Record<string, unknown>).validatedBody = result.data;
        }
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const validationErrors = formatZodError(result.error, 'query');
          errors.push(...validationErrors);
        } else if (stripUnknown) {
          (req as Record<string, unknown>).validatedQuery = result.data;
        }
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const validationErrors = formatZodError(result.error, 'params');
          errors.push(...validationErrors);
        } else if (stripUnknown) {
          (req as Record<string, unknown>).validatedParams = result.data;
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Request validation failed', {
          errors,
          totalErrors: errors.length,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

function formatZodError(
  error: ZodError,
  source: 'body' | 'query' | 'params'
): Array<{ field: string; path: string; message: string }> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    path: `${source}.${err.path.join('.')}`,
    message: err.message,
  }));
}

export const validateBody = (schema: ZodSchema, options?: ValidationOptions) => {
  return validate({ body: schema }, options);
};

export const validateQuery = (schema: ZodSchema, options?: ValidationOptions) => {
  return validate({ query: schema }, options);
};

export const validateParams = (schema: ZodSchema, options?: ValidationOptions) => {
  return validate({ params: schema }, options);
};