const ActiveTaskService = require('./active-task.service');

function startRecurringService() {
  setInterval(async () => {
    try {
      const { db } = require('../config/database');
      const tasks = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM active_tasks 
           WHERE status = 'active'
             AND completed_iterations < total_iterations
             AND datetime(next_iteration_at) <= datetime('now')`,
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });

      for (const task of tasks) {
        try {
          await ActiveTaskService.createIteration(task.id);
        } catch (error) {
          console.error(`Ошибка создания итерации для задачи ${task.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Ошибка в recurring service:', error);
    }
  }, 1000);

  console.log('🔄 Сервис интервальных транзакций запущен (проверка каждую секунду)');
}

module.exports = { startRecurringService };