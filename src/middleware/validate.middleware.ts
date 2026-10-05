import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { BadRequestError } from "../shared/errors/AppError";

interface ValidationOptions {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

const formatZodError = (error: ZodError): string => {
  return error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
};

/**
 * Validates request body, query, or params against a Zod schema.
 */
export const validateRequest = (schemaOrOptions: ZodTypeAny | ValidationOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ("parseAsync" in schemaOrOptions) {
        // Direct body schema provided
        req.body = await schemaOrOptions.parseAsync(req.body);
      } else {
        if (schemaOrOptions.body) {
          req.body = await schemaOrOptions.body.parseAsync(req.body);
        }
        if (schemaOrOptions.query) {
          req.query = await schemaOrOptions.query.parseAsync(req.query);
        }
        if (schemaOrOptions.params) {
          req.params = await schemaOrOptions.params.parseAsync(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new BadRequestError(formatZodError(error)));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodTypeAny) => validateRequest({ body: schema });
export const validateQuery = (schema: ZodTypeAny) => validateRequest({ query: schema });
export const validateParams = (schema: ZodTypeAny) => validateRequest({ params: schema });
