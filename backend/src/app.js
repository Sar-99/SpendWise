require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { startRecurringService } = require('./services/recurring.service');
const { initSocket } = require('./config/socket');

const app = express();
const PORT = process.env.PORT || 3001;

// Импорт маршрутов
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const transactionRoutes = require('./routes/transaction.routes');
const activeTaskRoutes = require('./routes/active-task.routes');
const iterationRoutes = require('./routes/iteration.routes');

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.4:5173'],
  credentials: true
}));

app.use(express.json());

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/active-tasks', activeTaskRoutes);
app.use('/api/iterations', iterationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Не найдено' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервиса интервальных транзакций
startRecurringService();

// Создаём HTTP-сервер и подключаем Socket.io
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});