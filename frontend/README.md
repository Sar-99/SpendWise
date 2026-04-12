# SpendWise

**SpendWise** – это веб-приложение для управления личными финансами с поддержкой обычных транзакций и интервальных задач (регулярных доходов/расходов). Проект выполнен в рамках курсовой работы. Приложение позволяет создавать несколько профилей, вести учёт доходов и расходов, а также настраивать автоматические повторяющиеся операции с гибкими интервалами.

## Основные возможности

- Регистрация и аутентификация пользователей (JWT).
- Управление профилями – до 3 профилей на пользователя.
- Обычные транзакции (доходы/расходы) с автоматической нумерацией.
- Интервальные задачи – автоматическое создание итераций по заданному интервалу (секунды, минуты, часы, дни).
- Прогресс выполнения задачи, обратный отсчёт до следующей итерации.
- История транзакций с возможностью редактирования описания и удаления.
- Завершённые задачи автоматически преобразуются в транзакции и попадают в историю.
- Статистика баланса, суммы доходов и расходов в реальном времени.
- Синхронизация через WebSocket и периодический опрос (polling) для надёжности.
- Адаптивный интерфейс (темная тема, Tailwind CSS).

## Технологический стек

### Backend
- **Node.js** + **Express** – серверная платформа.
- **SQLite** – встроенная реляционная база данных.
- **JWT** – аутентификация.
- **Socket.IO** – реальное время.
- **bcryptjs** – хеширование паролей.

### Frontend
- **React 19** + **Vite** – сборка.
- **React Router** – маршрутизация.
- **Tailwind CSS** – стилизация.
- **Lucide React** – иконки.
- **Socket.IO-client** – клиент для WebSocket.

## Установка и запуск

### Требования
- Node.js (версия 18 или выше)
- npm или yarn

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd spendwise
```

### 2. Backend
```bash
cd backend
npm install
# Создать файл .env (опционально, можно использовать значения по умолчанию)
cp .env.example .env   # если есть, иначе создайте вручную
npm run dev
```
Сервер запустится на порту 3001 (или указанном в .env).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Фронтенд будет доступен на `http://localhost:5173`.

### 4. База данных
При первом запуске backend автоматически создаст файл `database.sqlite` в корне проекта и инициализирует все таблицы.

## Структура проекта

```
spendwise/
├── backend/
│   ├── config/
│   │   ├── database.js      # инициализация БД, генерация id
│   │   └── socket.js        # настройка Socket.IO
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── transaction.controller.js
│   │   └── active-task.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Transaction.js
│   │   ├── ActiveTask.js
│   │   └── TaskIteration.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── transaction.routes.js
│   │   ├── active-task.routes.js
│   │   └── iteration.routes.js
│   ├── services/
│   │   ├── active-task.service.js   # логика интервальных задач
│   │   └── recurring.service.js     # планировщик итераций
│   └── app.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # форма входа/регистрации
│   │   │   ├── profiles/           # экран управления профилями
│   │   │   ├── workspace/          # основная рабочая область
│   │   │   │   ├── modals/         # модальные окна
│   │   │   │   ├── ActiveTasks.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── StatsBar.jsx
│   │   │   │   ├── TransactionHistory.jsx
│   │   │   │   └── Workspace.jsx
│   │   │   └── common/             # переиспользуемые компоненты
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/
│   │   │   └── api.js              # HTTP-запросы
│   │   ├── utils/
│   │   │   ├── formatters.js       # форматирование валюты, времени
│   │   │   └── validators.js       # валидация форм
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── database.sqlite                 # автоматически создаётся
```

## Схема базы данных

### users
- id (TEXT, PK)
- nickname (TEXT, UNIQUE)
- password_hash (TEXT)
- created_at (DATETIME)

### profiles
- id (TEXT, PK)
- user_id (TEXT, FK -> users.id)
- name (TEXT)
- currency (TEXT)
- next_income_number, next_expense_number, next_task_number (INTEGER)
- created_at (DATETIME)

### transaction_history
- id (TEXT, PK)
- profile_id (TEXT, FK -> profiles.id)
- type (income/expense)
- amount (DECIMAL)
- description (TEXT)
- date (DATE), time (TIME)
- is_interval (BOOLEAN)
- interval_task_id (TEXT, ссылка на активную задачу)
- created_at (DATETIME)

### active_tasks
- id (TEXT, PK)
- profile_id (TEXT, FK -> profiles.id)
- description (TEXT)
- type (income/expense)
- amount (DECIMAL)
- interval_value, interval_unit
- duration_value, duration_unit
- total_iterations, completed_iterations
- accumulated_amount (DECIMAL)
- next_iteration_at (DATETIME)
- task_number (INTEGER)
- status (active/completed)
- created_at (DATETIME)

### task_iterations
- id (TEXT, PK)
- task_id (TEXT, FK -> active_tasks.id ON DELETE CASCADE)
- amount (DECIMAL)
- description (TEXT)
- date (DATE), time (TIME)
- iteration_number (INTEGER)
- created_at (DATETIME)

## Скриншоты

-

## Заключение

SpendWise – полностью функциональное приложение для учёта финансов, реализующее как стандартные операции, так и автоматические повторяющиеся транзакции. Проект отличается чистой архитектурой, использованием современных технологий и удобным интерфейсом. Он может быть использован для личного ведения бюджета или как основа для дальнейшего расширения.

---

**Автор:**  
S-J
**Год разработки:** 2026