const ActiveTaskService = require('../services/active-task.service');
const Profile = require('../models/Profile');
const ActiveTask = require('../models/ActiveTask');
const { getSocket } = require('../config/socket');

class ActiveTaskController {
  static async getTasks(req, res) {
    try {
      const userId = req.user.id;
      const { profileId } = req.query;
      if (!profileId) return res.status(400).json({ error: 'profileId обязателен' });
      const profile = await Profile.findByIdAndUserId(profileId, userId);
      if (!profile) return res.status(403).json({ error: 'Доступ запрещен' });
      const tasks = await ActiveTaskService.getActiveTasks(profileId);
      res.json(tasks);
    } catch (error) {
      console.error('Ошибка получения задач:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async getTaskById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { db } = require('../config/database');
      const task = await new Promise((resolve, reject) => {
        db.get(
          `SELECT at.* FROM active_tasks at
           JOIN profiles p ON at.profile_id = p.id
           WHERE at.id = ? AND p.user_id = ?`,
          [id, userId],
          (err, row) => { if (err) reject(err); else resolve(row); }
        );
      });
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });
      res.json(task);
    } catch (error) {
      console.error('Ошибка получения задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async createTask(req, res) {
    try {
      const userId = req.user.id;
      const { profileId, description, type, amount, intervalValue, intervalUnit, durationValue, durationUnit } = req.body;
      if (!profileId || !type || !amount || !intervalValue || !durationValue) {
        return res.status(400).json({ error: 'Обязательные поля: profileId, type, amount, intervalValue, durationValue' });
      }
      const taskDescription = description && description.trim() ? description.trim() : '';
      const profile = await Profile.findByIdAndUserId(profileId, userId);
      if (!profile) return res.status(403).json({ error: 'Доступ запрещен' });

      const convertToSeconds = (value, unit) => {
        const n = Number(value);
        if (isNaN(n) || n <= 0) return 0;
        switch (unit) {
          case 'seconds': return n;
          case 'minutes': return n * 60;
          case 'hours': return n * 60 * 60;
          case 'days': return n * 60 * 60 * 24;
          default: return n;
        }
      };
      const intervalSec = convertToSeconds(intervalValue, intervalUnit);
      const durationSec = convertToSeconds(durationValue, durationUnit);
      if (intervalSec === 0 || durationSec === 0 || durationSec < intervalSec) {
        return res.status(400).json({ error: 'Некорректные параметры интервала' });
      }
      let totalIterations = Math.floor(durationSec / intervalSec);
      if (totalIterations < 1) totalIterations = 1;

      const task = await ActiveTaskService.createTask({
        profileId, description: taskDescription, type, amount: parseFloat(amount),
        intervalValue: parseInt(intervalValue), intervalUnit,
        durationValue: parseInt(durationValue), durationUnit,
        totalIterations
      });
      res.status(201).json(task);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async updateDescription(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { description } = req.body;

      const task = await new Promise((resolve, reject) => {
        const { db } = require('../config/database');
        db.get(
          `SELECT at.* FROM active_tasks at
           JOIN profiles p ON at.profile_id = p.id
           WHERE at.id = ? AND p.user_id = ?`,
          [id, userId],
          (err, row) => { if (err) reject(err); else resolve(row); }
        );
      });
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });

      await ActiveTask.updateDescription(id, description);

      const io = getSocket();
      if (io) {
        const updatedTask = await ActiveTask.findById(id);
        io.to(`profile:${task.profile_id}`).emit('task:updated', updatedTask);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка обновления описания задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка' });
    }
  }

  static async deleteTask(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { db } = require('../config/database');
      const task = await new Promise((resolve, reject) => {
        db.get(
          `SELECT at.* FROM active_tasks at
           JOIN profiles p ON at.profile_id = p.id
           WHERE at.id = ? AND p.user_id = ?`,
          [id, userId],
          (err, row) => { if (err) reject(err); else resolve(row); }
        );
      });
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });
      await ActiveTaskService.deleteTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = ActiveTaskController;