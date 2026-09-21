import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

// Express Request tipini genişlet
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

/**
 * Bearer token ile oturum kontrolü yapan Express ara yazılımı.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Geçersiz oturum tokeni' });
    return;
  }

  const db = getDb();
  const session = db
    .prepare(`
      SELECT s.token, s.expires_at, u.id, u.email, u.name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `)
    .get(token) as { token: string; expires_at: string; id: number; email: string; name: string } | undefined;

  if (!session) {
    res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz' });
    return;
  }

  req.user = {
    id: session.id,
    email: session.email,
    name: session.name,
  };
  req.token = token;

  next();
}
