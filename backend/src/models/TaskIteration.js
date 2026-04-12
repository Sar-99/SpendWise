const { db } = require('../config/database');

class TaskIteration {
  static async create(data) {
    const id = require('../config/database').generateId();
    const { taskId, amount, description, date, time, iterationNumber } = data;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO task_iterations (id, task_id, amount, description, date, time, iteration_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, taskId, amount, description, date, time, iterationNumber],
        function (err) {
          if (err) reject(err);
          resolve({ id, task_id: taskId, amount, description, date, time, iteration_number: iterationNumber });
        }
      );
    });
  }

  static async findByTaskId(taskId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM task_iterations WHERE task_id = ? ORDER BY iteration_number ASC',
        [taskId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async update(id, updates) {
    const { amount, description } = updates;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE task_iterations SET amount = ?, description = ? WHERE id = ?',
        [amount, description, id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async delete(id) {
    console.log(`🗑️ Удаление итерации с id: ${id}`);
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM task_iterations WHERE id = ?', [id], function (err) {
        if (err) {
          console.error(`❌ Ошибка удаления итерации ${id}:`, err);
          reject(err);
        } else {
          console.log(`✅ Итерация ${id} удалена (изменено строк: ${this.changes})`);
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  static async deleteByTaskId(taskId) {
    console.log(`🗑️ Удаление всех итераций для задачи ${taskId}`);
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM task_iterations WHERE task_id = ?', [taskId], function (err) {
        if (err) {
          console.error(`❌ Ошибка удаления итераций для задачи ${taskId}:`, err);
          reject(err);
        } else {
          console.log(`✅ Удалено итераций: ${this.changes}`);
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }
}

module.exports = TaskIteration;