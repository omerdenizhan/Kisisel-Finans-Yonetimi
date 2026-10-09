/**
 * Bir Express handler'ını sarmalayıp request'in ilgili bölümünü zod ile doğrular.
 * Doğrulanmış değeri handler'a `req.validated.{source}` üzerinden geçirir
 * (Express tip çakışmalarını önlemek için orijinal req'i değiştirmez).
 */
export function validate(schema, source = 'body') {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success)
            return next(result.error);
        req.validated = { ...(req.validated ?? {}), [source]: result.data };
        next();
    };
}
export function validated(req, source) {
    return req.validated?.[source];
}
