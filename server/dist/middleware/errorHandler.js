import { ZodError } from 'zod';
export class HttpError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
export function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Bulunamadı', path: req.path });
}
export function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Doğrulama hatası',
            issues: err.issues,
        });
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.status).json({
            error: err.message,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }
    console.error('[error]', err);
    res.status(500).json({ error: 'Sunucu hatası' });
}
