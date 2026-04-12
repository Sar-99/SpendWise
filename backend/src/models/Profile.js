const { db } = require('../config/database');

class Profile {
  static async create(userId, name, currency = 'USD') {
    const id = require('../config/database').generateId();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO profiles (id, user_id, name, currency) VALUES (?, ?, ?, ?)',
        [id, userId, name, currency],
        function (err) {
          if (err) reject(err);
          resolve({ id, userId, name, currency });
        }
      );
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async findByIdAndUserId(id, userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM profiles WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
  }

  static async update(id, userId, updates) {
    const { name, currency } = updates;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE profiles SET name = ?, currency = ? WHERE id = ? AND user_id = ?',
        [name, currency, id, userId],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM profiles WHERE id = ? AND user_id = ?',
        [id, userId],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async countByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM profiles WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row.count);
        }
      );
    });
  }

  static async getNextIncomeNumber(profileId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT next_income_number FROM profiles WHERE id = ?', [profileId], (err, row) => {
        if (err) return reject(err);
        const num = row ? row.next_income_number : 1;
        db.run('UPDATE profiles SET next_income_number = next_income_number + 1 WHERE id = ?', [profileId], (err2) => {
          if (err2) reject(err2);
          else resolve(num);
        });
      });
    });
  }

  static async getNextExpenseNumber(profileId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT next_expense_number FROM profiles WHERE id = ?', [profileId], (err, row) => {
        if (err) return reject(err);
        const num = row ? row.next_expense_number : 1;
        db.run('UPDATE profiles SET next_expense_number = next_expense_number + 1 WHERE id = ?', [profileId], (err2) => {
          if (err2) reject(err2);
          else resolve(num);
        });
      });
    });
  }

  static async getNextTaskNumber(profileId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT next_task_number FROM profiles WHERE id = ?', [profileId], (err, row) => {
        if (err) return reject(err);
        const num = row ? row.next_task_number : 1;
        db.run('UPDATE profiles SET next_task_number = next_task_number + 1 WHERE id = ?', [profileId], (err2) => {
          if (err2) reject(err2);
          else resolve(num);
        });
      });
    });
  }
}

module.exports = Profile;