import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
type Source = 'body' | 'query' | 'params';
export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) return next(result.error);
        (req as any).validated = { ...((req as any).validated ?? {}), [source]: result.data };
        next();
    };
}
export function validated<T = unknown>(req: Request, source: Source): T {
    return (req as any).validated?.[source] as T;
}
