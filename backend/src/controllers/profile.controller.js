const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');
const User = require('../models/User');

class ProfileController {
  static async getProfiles(req, res) {
    try {
      const userId = req.user.id;
      const profiles = await Profile.findByUserId(userId);
      res.json(profiles);
    } catch (error) {
      console.error('Ошибка получения профилей:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async createProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, currency = 'USD' } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Название обязательно' });
      }

      // Проверяем количество существующих профилей
      const profileCount = await Profile.countByUserId(userId);
      if (profileCount >= 3) {
        return res.status(400).json({ error: 'Максимум 3 профиля' });
      }

      // Проверяем, существует ли профиль с таким именем
      const existingProfiles = await Profile.findByUserId(userId);
      const profileExists = existingProfiles.some(p => p.name === name.trim());
      if (profileExists) {
        return res.status(400).json({ error: 'Профиль с таким названием уже существует' });
      }

      const profile = await Profile.create(userId, name.trim(), currency);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Ошибка создания профиля:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, currency } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Название обязательно' });
      }

      // Проверяем, существует ли другой профиль с таким именем
      const existingProfiles = await Profile.findByUserId(userId);
      const profileExists = existingProfiles.some(p => p.name === name.trim() && p.id !== id);
      if (profileExists) {
        return res.status(400).json({ error: 'Профиль с таким названием уже существует' });
      }

      const updated = await Profile.update(id, userId, { name: name.trim(), currency });
      if (updated === 0) {
        return res.status(404).json({ error: 'Профиль не найден' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async deleteProfile(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { password } = req.body; // Получаем пароль из тела запроса

      // Проверяем существование профиля
      const profile = await Profile.findByIdAndUserId(id, userId);
      if (!profile) {
        return res.status(404).json({ error: 'Профиль не найден' });
      }

      // Проверяем пароль пользователя (если передан)
      if (password) {
        const user = await User.findById(userId);
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Неверный пароль' });
        }
      }

      await Profile.delete(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления профиля:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = ProfileController;