const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const TaskIteration = require('../models/TaskIteration');
const ActiveTask = require('../models/ActiveTask');
const { getSocket } = require('../config/socket');

router.use(authMiddleware);

// Получить все итерации задачи
router.get('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await new Promise((resolve, reject) => {
            const { db } = require('../config/database');
            db.get(
                `SELECT at.* FROM active_tasks at
         JOIN profiles p ON at.profile_id = p.id
         WHERE at.id = ? AND p.user_id = ?`,
                [taskId, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
        if (!task) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        const iterations = await TaskIteration.findByTaskId(taskId);
        res.json(iterations);
    } catch (error) {
        console.error('Ошибка получения итераций:', error);
        res.status(500).json({ error: 'Внутренняя ошибка' });
    }
});

// Создать итерацию вручную
router.post('/', async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({ error: 'taskId обязателен' });
        }

        const task = await new Promise((resolve, reject) => {
            const { db } = require('../config/database');
            db.get(
                `SELECT at.* FROM active_tasks at
         JOIN profiles p ON at.profile_id = p.id
         WHERE at.id = ? AND p.user_id = ?`,
                [taskId, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!task) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }

        const ActiveTaskService = require('../services/active-task.service');
        const updatedTask = await ActiveTaskService.createIteration(taskId);

        if (!updatedTask) {
            return res.status(400).json({ error: 'Не удалось создать итерацию (возможно, задача уже завершена)' });
        }

        res.json({ success: true, task: updatedTask });
    } catch (error) {
        console.error('Ошибка создания итерации вручную:', error);
        res.status(500).json({ error: 'Внутренняя ошибка' });
    }
});

// Обновить итерацию (описание)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        const iteration = await new Promise((resolve, reject) => {
            const { db } = require('../config/database');
            db.get(
                `SELECT ti.* FROM task_iterations ti
         JOIN active_tasks at ON ti.task_id = at.id
         JOIN profiles p ON at.profile_id = p.id
         WHERE ti.id = ? AND p.user_id = ?`,
                [id, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
        if (!iteration) {
            return res.status(404).json({ error: 'Итерация не найдена' });
        }

        await TaskIteration.update(id, { description });

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка обновления итерации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка' });
    }
});

// Удалить итерацию
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const iteration = await new Promise((resolve, reject) => {
            const { db } = require('../config/database');
            db.get(
                `SELECT ti.* FROM task_iterations ti
         JOIN active_tasks at ON ti.task_id = at.id
         JOIN profiles p ON at.profile_id = p.id
         WHERE ti.id = ? AND p.user_id = ?`,
                [id, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
        if (!iteration) {
            return res.status(404).json({ error: 'Итерация не найдена' });
        }

        const taskId = iteration.task_id;
        await TaskIteration.delete(id);

        // Обновляем накопленную сумму в активной задаче
        const allIterations = await TaskIteration.findByTaskId(taskId);
        const totalAmount = allIterations.reduce((sum, it) => sum + it.amount, 0);

        await new Promise((resolve, reject) => {
            const { db } = require('../config/database');
            db.run(
                'UPDATE active_tasks SET accumulated_amount = ? WHERE id = ?',
                [totalAmount, taskId],
                (err) => err ? reject(err) : resolve()
            );
        });

        const io = getSocket();
        if (io) {
            const task = await ActiveTask.findById(taskId);
            if (task) {
                io.to(`profile:${task.profile_id}`).emit('iteration:deleted', {
                    taskId,
                    iterationId: id,
                    totalAmount
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления итерации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка' });
    }
});

module.exports = router;