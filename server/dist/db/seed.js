import { getDb } from './connection.js';
import { hashPassword } from '../utils/crypto.js';
const DEFAULT_CATEGORIES = [
    // Gelir
    { name: 'Maaş', type: 'income', color: '#10b981', icon: 'Briefcase' },
    { name: 'Freelance', type: 'income', color: '#06b6d4', icon: 'Laptop' },
    { name: 'Kira Geliri', type: 'income', color: '#0ea5e9', icon: 'Home' },
    { name: 'Yatırım Geliri', type: 'income', color: '#8b5cf6', icon: 'TrendingUp' },
    { name: 'Bonus', type: 'income', color: '#f59e0b', icon: 'Gift' },
    { name: 'Diğer Gelir', type: 'income', color: '#64748b', icon: 'Plus' },
    // Gider
    { name: 'Yemek', type: 'expense', color: '#f97316', icon: 'UtensilsCrossed' },
    { name: 'Ulaşım', type: 'expense', color: '#3b82f6', icon: 'Car' },
    { name: 'Kira', type: 'expense', color: '#a855f7', icon: 'Home' },
    { name: 'Faturalar', type: 'expense', color: '#ef4444', icon: 'Receipt' },
    { name: 'Eğlence', type: 'expense', color: '#ec4899', icon: 'Music' },
    { name: 'Alışveriş', type: 'expense', color: '#d946ef', icon: 'ShoppingBag' },
    { name: 'Sağlık', type: 'expense', color: '#14b8a6', icon: 'HeartPulse' },
    { name: 'Eğitim', type: 'expense', color: '#6366f1', icon: 'GraduationCap' },
    { name: 'Diğer Gider', type: 'expense', color: '#64748b', icon: 'Minus' },
];
/**
 * Veritabanı boşsa varsayılan kategorileri, ayarları ve ilk kullanıcıyı ekler.
 * Idempotent — tekrar çalıştırmak sorun olmaz.
 */
export function runSeed() {
    const db = getDb();
    // İlk Kullanıcı (admin@admin.com / 12345678)
    const existingUser = db
        .prepare('SELECT COUNT(*) as count FROM users')
        .get();
    if (existingUser.count === 0) {
        const { hash, salt } = hashPassword('12345678');
        db.prepare(`
      INSERT INTO users (email, password_hash, password_salt, name)
      VALUES (?, ?, ?, ?)
    `).run('admin@admin.com', hash, salt, 'Administrator');
        console.log('[seed] initial admin user created (admin@admin.com)');
    }
    // Kategoriler
    const existing = db
        .prepare('SELECT COUNT(*) as count FROM categories')
        .get();
    if (existing.count === 0) {
        const insert = db.prepare('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)');
        const insertMany = db.transaction((rows) => {
            for (const r of rows)
                insert.run(r.name, r.type, r.color, r.icon);
        });
        insertMany(DEFAULT_CATEGORIES);
        console.log(`[seed] inserted ${DEFAULT_CATEGORIES.length} default categories`);
    }
    // Varsayılan ayarlar
    const defaults = [
        ['theme', 'light'],
        ['currency', 'TRY'],
        ['locale', 'tr-TR'],
        ['first_day_of_week', '1'],
    ];
    const setSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of defaults)
        setSetting.run(k, v);
}
