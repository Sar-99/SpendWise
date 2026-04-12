const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  db.serialize(() => {
    // Пользователи
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Профили
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        currency TEXT DEFAULT 'USD',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        next_income_number INTEGER DEFAULT 1,
        next_expense_number INTEGER DEFAULT 1,
        next_task_number INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      )
    `);

    // История транзакций
    db.run(`
      CREATE TABLE IF NOT EXISTS transaction_history (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        is_interval BOOLEAN DEFAULT 0,
        interval_task_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
      )
    `);

    // Активные задачи
    db.run(`
      CREATE TABLE IF NOT EXISTS active_tasks (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(10, 2) NOT NULL,
        interval_value INTEGER NOT NULL,
        interval_unit TEXT NOT NULL,
        duration_value INTEGER NOT NULL,
        duration_unit TEXT NOT NULL,
        total_iterations INTEGER NOT NULL,
        completed_iterations INTEGER DEFAULT 0,
        accumulated_amount DECIMAL(10, 2) DEFAULT 0,
        next_iteration_at DATETIME,
        task_number INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
      )
    `);

    // Итерации
    db.run(`
      CREATE TABLE IF NOT EXISTS task_iterations (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        iteration_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES active_tasks (id) ON DELETE CASCADE
      )
    `);

    // Индексы
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_history_profile_id ON transaction_history(profile_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_history_date ON transaction_history(date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_active_tasks_profile_id ON active_tasks(profile_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_active_tasks_status ON active_tasks(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_task_iterations_task_id ON task_iterations(task_id)`);

    console.log('✅ База данных инициализирована');
  });
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

db.on('open', initializeDatabase);

module.exports = { db, generateId };