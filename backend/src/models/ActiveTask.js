const { db } = require('../config/database');

class ActiveTask {
  static async create(taskData) {
    const id = require('../config/database').generateId();
    const { taskNumber } = taskData;
    const nextIterationAt = new Date(Date.now() + taskData.intervalValue * 1000).toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO active_tasks 
         (id, profile_id, description, type, amount, interval_value, interval_unit,
          duration_value, duration_unit, total_iterations, next_iteration_at,
          completed_iterations, accumulated_amount, task_number, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          taskData.profileId,
          taskData.description,
          taskData.type,
          taskData.amount,
          taskData.intervalValue,
          taskData.intervalUnit,
          taskData.durationValue,
          taskData.durationUnit,
          taskData.totalIterations,
          nextIterationAt,
          0,
          0,
          taskNumber,
          'active'
        ],
        function (err) {
          if (err) reject(err);
          db.get('SELECT * FROM active_tasks WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM active_tasks WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async findByProfileId(profileId, status = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM active_tasks WHERE profile_id = ?';
      const params = [profileId];
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static async updateAfterIteration(taskId, newCompletedIterations, newAccumulated, nextIterationAt) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE active_tasks 
         SET completed_iterations = ?, accumulated_amount = ?, next_iteration_at = ?
         WHERE id = ?`,
        [newCompletedIterations, newAccumulated, nextIterationAt, taskId],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE active_tasks SET status = ? WHERE id = ?',
        [status, id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async updateDescription(id, description) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE active_tasks SET description = ? WHERE id = ?',
        [description, id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async delete(id) {
    console.log(`🗑️ Удаление активной задачи с id: ${id}`);
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM active_tasks WHERE id = ?', [id], function (err) {
        if (err) {
          console.error(`❌ Ошибка удаления задачи ${id}:`, err);
          reject(err);
        } else {
          console.log(`✅ Задача ${id} удалена (изменено строк: ${this.changes})`);
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }
}

module.exports = ActiveTask;