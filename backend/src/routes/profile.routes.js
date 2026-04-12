const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/auth.middleware');
const ProfileController = require('../controllers/profile.controller');
const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);

router.get('/', ProfileController.getProfiles);
router.post('/', ProfileController.createProfile);
router.put('/:id', ProfileController.updateProfile);
router.delete('/:id', ProfileController.deleteProfile);

router.post('/:id/verify-user-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Проверяем существование профиля
    const profile = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM profiles WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!profile) {
      return res.status(404).json({ error: 'Профиль не найден' });
    }

    // Получаем пароль пользователя
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    res.json({ valid: validPassword });
  } catch (error) {
    console.error('Ошибка проверки пароля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;