const ActiveTask = require('../models/ActiveTask');
const TaskIteration = require('../models/TaskIteration');
const Transaction = require('../models/Transaction');
const Profile = require('../models/Profile');
const { getSocket } = require('../config/socket');

function convertIntervalToMs(value, unit) {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return 0;
  switch (unit) {
    case 'seconds': return n * 1000;
    case 'minutes': return n * 60 * 1000;
    case 'hours': return n * 60 * 60 * 1000;
    case 'days': return n * 24 * 60 * 60 * 1000;
    default: return n * 1000;
  }
}

class ActiveTaskService {
  static async createTask(taskData) {
    let task;
    try {
      const taskNumber = await Profile.getNextTaskNumber(taskData.profileId);
      const finalDescription = taskData.description && taskData.description.trim()
        ? taskData.description.trim()
        : `Активная задача #${taskNumber}`;

      task = await ActiveTask.create({ ...taskData, description: finalDescription, taskNumber });

      const now = new Date();
      const iteration = await TaskIteration.create({
        taskId: task.id,
        amount: task.amount,
        description: `Итерация #1`,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 8),
        iterationNumber: 1
      });

      const newCompleted = 1;
      const newAccumulated = task.amount;
      const intervalMs = convertIntervalToMs(task.interval_value, task.interval_unit);
      const nextIterationAt = new Date(now.getTime() + intervalMs).toISOString();
      await ActiveTask.updateAfterIteration(
        task.id,
        newCompleted,
        newAccumulated,
        nextIterationAt
      );

      const updatedTask = await ActiveTask.findById(task.id);

      const io = getSocket();
      if (io) {
        io.to(`profile:${task.profile_id}`).emit('iteration:created', {
          task: updatedTask,
          iteration
        });
      }

      return updatedTask;
    } catch (error) {
      console.error('❌ Ошибка в createTask:', error);
      if (task && task.id) {
        await ActiveTask.delete(task.id).catch(e => console.error('Ошибка при откате:', e));
      }
      throw error;
    }
  }

  static async createIteration(taskId) {
    try {
      const task = await ActiveTask.findById(taskId);
      if (!task) return null;
      if (task.status !== 'active') return null;
      if (task.completed_iterations >= task.total_iterations) {
        await this.completeTask(task);
        return null;
      }

      const newIterationNumber = task.completed_iterations + 1;
      const now = new Date();

      const iteration = await TaskIteration.create({
        taskId,
        amount: task.amount,
        description: `Итерация #${newIterationNumber}`,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 8),
        iterationNumber: newIterationNumber
      });

      const newCompleted = newIterationNumber;
      const newAccumulated = (task.accumulated_amount || 0) + task.amount;
      const isCompleted = newCompleted >= task.total_iterations;
      const intervalMs = convertIntervalToMs(task.interval_value, task.interval_unit);
      const nextIterationAt = isCompleted
        ? null
        : new Date(now.getTime() + intervalMs).toISOString();

      await ActiveTask.updateAfterIteration(
        taskId,
        newCompleted,
        newAccumulated,
        nextIterationAt
      );

      let updatedTask = await ActiveTask.findById(taskId);

      if (isCompleted) {
        await this.completeTask(updatedTask);
        updatedTask = await ActiveTask.findById(taskId);
      }

      const io = getSocket();
      if (io && updatedTask) {
        io.to(`profile:${task.profile_id}`).emit('iteration:created', {
          task: updatedTask,
          iteration
        });
      }

      return updatedTask;
    } catch (error) {
      console.error('Ошибка создания итерации:', error);
      throw error;
    }
  }

  static async completeTask(task) {
    const now = new Date();

    // Обновляем статус задачи
    await ActiveTask.updateStatus(task.id, 'completed');

    // Формируем описание для транзакции
    let transactionDescription = task.description;

    // Если описание соответствует стандартному шаблону активной задачи,
    // заменяем "Активная" на "Завершённая"
    if (transactionDescription && transactionDescription.startsWith('Активная задача #')) {
      transactionDescription = transactionDescription.replace('Активная задача #', 'Завершённая задача #');
    }

    // Если описание пустое (на всякий случай) – создаём стандартное
    if (!transactionDescription || transactionDescription.trim() === '') {
      transactionDescription = `Завершённая задача #${task.task_number}`;
    }

    // Создаём транзакцию
    const transaction = await Transaction.create({
      profileId: task.profile_id,
      type: task.type,
      amount: task.accumulated_amount,
      description: transactionDescription,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 8),
      isInterval: true,
      intervalTaskId: task.id
    });

    const io = getSocket();
    if (io) {
      const updatedTask = await ActiveTask.findById(task.id);
      io.to(`profile:${task.profile_id}`).emit('task:completed', {
        task: updatedTask,
        transaction
      });
    }
  }

  static async getActiveTasks(profileId) {
    return ActiveTask.findByProfileId(profileId, 'active');
  }

  static async deleteTask(taskId) {
    console.log(`🗑️ Удаление задачи ${taskId} и всех связанных данных`);
    await TaskIteration.deleteByTaskId(taskId);
    return ActiveTask.delete(taskId);
  }
}

module.exports = ActiveTaskService;