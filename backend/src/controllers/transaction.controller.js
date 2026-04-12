const Transaction = require('../models/Transaction');
const Profile = require('../models/Profile');
const ActiveTask = require('../models/ActiveTask');
const { getSocket } = require('../config/socket');

class TransactionController {
  static async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { profileId, startDate, endDate, categoryId, type, limit, offset } = req.query;

      if (!profileId) {
        return res.status(400).json({ error: 'profileId обязателен' });
      }

      const profile = await Profile.findByIdAndUserId(profileId, userId);
      if (!profile) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      const transactions = await Transaction.findByProfileId(profileId, {
        startDate, endDate, categoryId, type, limit, offset
      });

      res.json(transactions);
    } catch (error) {
      console.error('Ошибка получения транзакций:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { profileId, type, amount, description, date, time } = req.body;

      if (!profileId || !type || !amount || !date || !time) {
        return res.status(400).json({ error: 'Обязательные поля: profileId, type, amount, date, time' });
      }

      const profile = await Profile.findByIdAndUserId(profileId, userId);
      if (!profile) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      let txNumber, prefix;
      if (type === 'income') {
        txNumber = await Profile.getNextIncomeNumber(profileId);
        prefix = 'Доход';
      } else {
        txNumber = await Profile.getNextExpenseNumber(profileId);
        prefix = 'Расход';
      }

      const finalDescription = description && description.trim()
        ? description.trim()
        : `${prefix} #${txNumber}`;

      const transaction = await Transaction.create({
        profileId,
        type,
        amount: parseFloat(amount),
        description: finalDescription,
        date,
        time
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Ошибка создания транзакции:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { description } = req.body;

      const transaction = await new Promise((resolve, reject) => {
        const { db } = require('../config/database');
        db.get(
          `SELECT t.* FROM transaction_history t
           JOIN profiles p ON t.profile_id = p.id
           WHERE t.id = ? AND p.user_id = ?`,
          [id, userId],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          }
        );
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Транзакция не найдена' });
      }

      await Transaction.updateDescription(id, description);
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка обновления транзакции:', error);
      res.status(500).json({ error: 'Внутренняя ошибка' });
    }
  }

  static async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await new Promise((resolve, reject) => {
        const { db } = require('../config/database');
        db.get(
          `SELECT t.* FROM transaction_history t
         JOIN profiles p ON t.profile_id = p.id
         WHERE t.id = ? AND p.user_id = ?`,
          [id, userId],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          }
        );
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Транзакция не найдена' });
      }

      // Если транзакция интервальная, удаляем связанные итерации и задачу
      if (transaction.is_interval && transaction.interval_task_id) {
        const TaskIteration = require('../models/TaskIteration');
        const ActiveTask = require('../models/ActiveTask');

        console.log(`🗑️ Удаление итераций для задачи ${transaction.interval_task_id}`);
        // 1. Удаляем все итерации, связанные с этой задачей
        await TaskIteration.deleteByTaskId(transaction.interval_task_id);

        // 2. Удаляем саму задачу, если она ещё существует
        const task = await ActiveTask.findById(transaction.interval_task_id);
        if (task) {
          await ActiveTask.delete(transaction.interval_task_id);
        }

        // 3. Оповещаем клиентов через сокет
        const io = getSocket();
        if (io) {
          io.to(`profile:${transaction.profile_id}`).emit('task:deleted', {
            taskId: transaction.interval_task_id
          });
        }
      }

      const result = await Transaction.delete(id);
      if (result.changes === 0) {
        console.warn(`⚠️ Транзакция с id ${id} не найдена в БД при удалении`);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления транзакции:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async getStats(req, res) {
    try {
      const userId = req.user.id;
      const { profileId, startDate, endDate } = req.query;

      if (!profileId) {
        return res.status(400).json({ error: 'profileId обязателен' });
      }

      const profile = await Profile.findByIdAndUserId(profileId, userId);
      if (!profile) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      const stats = await Transaction.getStats(profileId, { startDate, endDate });
      res.json(stats);
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = TransactionController;