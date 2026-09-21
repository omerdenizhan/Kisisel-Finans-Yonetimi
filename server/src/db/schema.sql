-- Yerel Finance — SQLite şeması
-- Tek kullanıcı, yerel uygulama. Tüm tablolar paylaşılan tek veritabanında.

-- =============================================================
-- Kategoriler
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  color TEXT,
  icon TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- =============================================================
-- İşlemler (gelir & gider)
-- =============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount REAL NOT NULL CHECK(amount > 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  notes TEXT,
  date TEXT NOT NULL,
  installment_id INTEGER REFERENCES installments(id) ON DELETE SET NULL,
  recurring_id INTEGER REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_tx_type_date ON transactions(type, date);

-- =============================================================
-- Taksitli alımlar
-- =============================================================
CREATE TABLE IF NOT EXISTS installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_amount REAL NOT NULL CHECK(total_amount > 0),
  installment_count INTEGER NOT NULL CHECK(installment_count > 0),
  installment_amount REAL NOT NULL,
  start_date TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- Taksit ödemeleri (her ay için bir satır)
-- =============================================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installment_id INTEGER NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  is_paid INTEGER NOT NULL DEFAULT 0,
  paid_date TEXT,
  paid_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ip_installment ON installment_payments(installment_id);
CREATE INDEX IF NOT EXISTS idx_ip_due ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_ip_paid ON installment_payments(is_paid);

-- =============================================================
-- Tekrarlayan işlemler
-- =============================================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount REAL NOT NULL CHECK(amount > 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  notes TEXT,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_run_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON recurring_transactions(next_run_date);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(is_active);

-- =============================================================
-- Bütçeler
-- =============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount REAL NOT NULL CHECK(amount > 0),
  month TEXT NOT NULL,
  notes TEXT,
  UNIQUE(category_id, month)
);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);

-- =============================================================
-- Hedefler
-- =============================================================
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK(target_amount > 0),
  current_amount REAL NOT NULL DEFAULT 0,
  target_date TEXT,
  notes TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- Hatırlatıcılar
-- =============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL,
  type TEXT,
  is_done INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);

-- =============================================================
-- Ayarlar (anahtar-değer)
-- =============================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- =============================================================
-- Kullanıcılar ve Oturumlar
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =============================================================
-- Migration kaydı
-- =============================================================
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

