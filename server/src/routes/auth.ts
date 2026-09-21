import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../utils/crypto.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Parola gereklidir'),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'İsim en az 2 karakter olmalıdır').max(100),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut parola gereklidir'),
  newPassword: z.string().min(6, 'Yeni parola en az 6 karakter olmalıdır'),
});

/**
 * POST /api/auth/login
 * Kullanıcı girişi ve oturum tokeni üretimi.
 */
authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz giriş bilgileri' });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDb();

  const user = db
    .prepare('SELECT id, email, password_hash, password_salt, name FROM users WHERE lower(email) = lower(?)')
    .get(email) as { id: number; email: string; password_hash: string; password_salt: string; name: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    res.status(401).json({ error: 'E-posta veya parola hatalı' });
    return;
  }

  const token = generateSessionToken();

  // Oturumu veritabanına kaydet (30 gün geçerli)
  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, datetime('now', '+30 days'))
  `).run(token, user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * GET /api/auth/me
 * Aktif oturum kullanıcısını getirir.
 */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Oturumu sonlandırır.
 */
authRouter.post('/logout', requireAuth, (req, res) => {
  const db = getDb();
  if (req.token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  }
  res.json({ success: true, message: 'Çıkış yapıldı' });
});

/**
 * PUT /api/auth/profile
 * Kullanıcı profil bilgilerini (isim, e-posta) günceller.
 */
authRouter.put('/profile', requireAuth, (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz profil bilgileri' });
    return;
  }

  const { name, email } = parsed.data;
  const db = getDb();
  const userId = req.user!.id;

  // E-posta başka kullanıcı tarafından kullanılıyor mu kontrol et
  const existing = db
    .prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?')
    .get(email, userId);

  if (existing) {
    res.status(400).json({ error: 'Bu e-posta adresi başka bir hesapta kullanılıyor' });
    return;
  }

  db.prepare(`
    UPDATE users
    SET name = ?, email = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, email, userId);

  res.json({
    user: {
      id: userId,
      email,
      name,
    },
    message: 'Profil bilgileri güncellendi',
  });
});

/**
 * PUT /api/auth/change-password
 * Kullanıcı parolasını günceller.
 */
authRouter.put('/change-password', requireAuth, (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz parola bilgileri' });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;
  const db = getDb();
  const userId = req.user!.id;

  const user = db
    .prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .get(userId) as { password_hash: string; password_salt: string } | undefined;

  if (!user || !verifyPassword(currentPassword, user.password_hash, user.password_salt)) {
    res.status(400).json({ error: 'Mevcut parolanız hatalı' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);

  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_salt = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(hash, salt, userId);

  res.json({ success: true, message: 'Parolanız başarıyla güncellendi' });
});
