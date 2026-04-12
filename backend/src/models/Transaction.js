const { db } = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const id = require('../config/database').generateId();
    const { profileId, type, amount, description = '', date, time, isInterval = false, intervalTaskId = null } = transactionData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO transaction_history 
         (id, profile_id, type, amount, description, date, time, is_interval, interval_task_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, profileId, type, amount, description, date, time, isInterval ? 1 : 0, intervalTaskId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          db.get('SELECT * FROM transaction_history WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      );
    });
  }

  static async findByProfileId(profileId, filters = {}) {
    const { startDate, endDate, limit = 50, offset = 0 } = filters;

    let query = 'SELECT * FROM transaction_history WHERE profile_id = ?';
    const params = [profileId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static async delete(id) {
    console.log(`🗑️ Удаление транзакции с id: ${id}`);
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM transaction_history WHERE id = ?', [id], function (err) {
        if (err) {
          console.error(`❌ Ошибка удаления транзакции ${id}:`, err);
          reject(err);
        } else {
          console.log(`✅ Транзакция ${id} удалена (изменено строк: ${this.changes})`);
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  static async getStats(profileId, filters = {}) {
    const { startDate, endDate } = filters;

    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
      FROM transaction_history 
      WHERE profile_id = ?
    `;

    const params = [profileId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        const balance = (row.total_income || 0) - (row.total_expense || 0);
        resolve({ ...row, balance });
      });
    });
  }

  static async updateDescription(id, description) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE transaction_history SET description = ? WHERE id = ?',
        [description, id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }
}

module.exports = Transaction;