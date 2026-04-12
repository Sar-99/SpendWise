const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

class AuthController {
  static async register(req, res) {
    try {
      const { nickname, password, confirmPassword } = req.body;

      if (!nickname || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Заполните все поля' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Пароли не совпадают' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Минимум 6 символов' });
      }

      if (nickname.length < 3) {
        return res.status(400).json({ error: 'Никнейм: минимум 3 символа' });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
        return res.status(400).json({ error: 'Никнейм: только a-z, A-Z, 0-9, -, _' });
      }

      const existingUser = await User.findByNickname(nickname);
      if (existingUser) {
        return res.status(400).json({ error: 'Никнейм уже используется' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create(nickname, passwordHash);

      const token = jwt.sign(
        { id: user.id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        token,
        user: { id: user.id, nickname: user.nickname }
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async login(req, res) {
    try {
      const { nickname, password } = req.body;

      if (!nickname || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
      }

      const user = await User.findByNickname(nickname);
      if (!user) {
        return res.status(401).json({ error: 'Неверный никнейм или пароль' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Неверный никнейм или пароль' });
      }

      const token = jwt.sign(
        { id: user.id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: { id: user.id, nickname: user.nickname }
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(200).json({ valid: false });
      }

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('JWT verification error:', err.message);
          return res.status(200).json({ valid: false });
        }
        res.json({ valid: true, user: decoded });
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(200).json({ valid: false });
    }
  }

  static async verifyPassword(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Введите пароль' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      res.json({ valid: validPassword });
    } catch (error) {
      console.error('Ошибка проверки пароля:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  static async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(200).json({ valid: false });
      }

      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
          console.error('JWT verification error:', err.message);
          return res.status(200).json({ valid: false });
        }

        // ✅ Проверяем, существует ли пользователь в БД
        const user = await User.findById(decoded.id);
        if (!user) {
          console.warn(`Пользователь с id ${decoded.id} не найден в БД, токен недействителен`);
          return res.status(200).json({ valid: false });
        }

        res.json({ valid: true, user: { id: user.id, nickname: user.nickname } });
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(200).json({ valid: false });
    }
  }
}

module.exports = AuthController;