# Tracker — Product Requirements Document

**Version:** 2.0 (Client-Server)
**Date:** 2026-03-10
**Status:** Production-ready (dev deployment active)

---

## 1. Обзор продукта

**Tracker** — персональный инструмент продуктивности, совмещающий квартальную дорожную карту и недельный kanban-трекер. Задачи создаются в любом из двух видов и мгновенно синхронизируются между ними.

**Ключевая идея:** два представления одних и тех же данных — макро-обзор (квартальная дорожная карта) и микро-фокус (недельный kanban). Версия 2.0 — полноценная клиент-серверная архитектура с авторизацией и хранением данных на сервере.

**Возможности v2.0:**
- Авторизация (email + пароль) — данные каждого пользователя изолированы
- Данные хранятся на Convex.dev — не зависят от браузера/устройства
- Real-time синхронизация между вкладками/устройствами
- Доступ с любого устройства (телефон, планшет, компьютер)

---

## 2. Технологический стек

### Frontend
| Технология | Версия | Роль |
|-----------|--------|------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Типизация |
| Tailwind CSS | 4.2 | Стили |
| Vite | 7.3 | Сборщик |
| @dnd-kit (core/sortable/utilities) | 6/10/3 | Drag-and-drop |
| Zustand | 5.0 | UI-стейт (только модалки/навигация, не persisted) |
| convex | 1.32 | Клиент реального времени |
| @convex-dev/auth | 0.0.91 | Auth React hooks |

### Backend (Convex.dev)
| Технология | Версия | Роль |
|-----------|--------|------|
| Convex | 1.32 | BaaS: реальная БД + серверные функции + WebSocket |
| @convex-dev/auth | 0.0.91 | Аутентификация (email + пароль) |
| @auth/core | 0.37 | Auth провайдеры (Password) |

### Деплоймент (Dev)
- **Convex deployment:** `dev:doting-mink-769` (EU West)
- **Convex URL:** `https://doting-mink-769.eu-west-1.convex.cloud`
- **Frontend:** Vite dev server (localhost:5173) / или статика на любом хосте

---

## 3. Архитектура системы

### 3.1 Общая схема

```
┌─────────────────────────────────┐      ┌──────────────────────────────┐
│         BROWSER (React SPA)     │      │       CONVEX.DEV CLOUD       │
│                                 │      │                              │
│  ┌──────────────────────────┐   │ WS   │  ┌────────────────────────┐ │
│  │  ConvexAuthProvider      │◄──┼──────┼──│  Auth Functions         │ │
│  │  (session management)   │   │      │  │  (signIn/signOut/store) │ │
│  └────────────┬─────────────┘   │      │  └────────────────────────┘ │
│               │                 │      │                              │
│  ┌────────────▼─────────────┐   │      │  ┌────────────────────────┐ │
│  │  useConvexAuth()         │   │      │  │  Queries (real-time)   │ │
│  │  isAuthenticated?        │   │      │  │  quarters.list         │ │
│  └────────────┬─────────────┘   │      │  │  quarters.getActive    │ │
│               │                 │      │  │  streams.listByQuarter │ │
│  ┌────────────▼─────────────┐   │      │  │  tasks.listByStreamWeek│ │
│  │  App (auth gate)         │   │      │  │  tasks.listByQuarterWk │ │
│  │  AuthScreen | AppContent │   │      │  └────────────────────────┘ │
│  └──────────────────────────┘   │      │                              │
│                                 │      │  ┌────────────────────────┐ │
│  ┌──────────────────────────┐   │      │  │  Mutations             │ │
│  │  Convex Hooks            │   │      │  │  quarters.add/remove   │ │
│  │  useConvexQuarters()     │◄──┼──────┼──│  streams.add/update    │ │
│  │  useConvexStreams()       │   │      │  │  tasks.add/update      │ │
│  │  useConvexTasks()        │   │      │  │  tasks.updateStatus    │ │
│  └──────────────────────────┘   │      │  │  tasks.reorderInWeek   │ │
│                                 │      │  └────────────────────────┘ │
│  ┌──────────────────────────┐   │      │                              │
│  │  Zustand uiStore         │   │      │  ┌────────────────────────┐ │
│  │  (модалки, навигация)    │   │      │  │  Database (Convex)     │ │
│  └──────────────────────────┘   │      │  │  quarters / streams    │ │
│                                 │      │  │  tasks / userSettings  │ │
└─────────────────────────────────┘      │  │  + authTables          │ │
                                         │  └────────────────────────┘ │
                                         └──────────────────────────────┘
```

### 3.2 Схема базы данных

```
authTables (управляется @convex-dev/auth)
  users            — аккаунты пользователей
  authAccounts     — привязка провайдеров (email/password)
  authSessions     — активные сессии
  authRefreshTokens
  authVerificationCodes
  authVerifiers
  authRateLimits

userSettings
  _id: Id<"userSettings">
  userId: Id<"users">
  activeQuarterId?: Id<"quarters">
  Индекс: by_user

quarters
  _id: Id<"quarters">
  userId: Id<"users">       ← изоляция данных по пользователю
  label: string             ← "Q1 2026"
  year: number
  quarter: number           ← 1 | 2 | 3 | 4
  startDate: string         ← ISO-дата понедельника W1
  Индексы: by_user, by_user_year_quarter

streams
  _id: Id<"streams">
  userId: Id<"users">
  name: string              ← "Backend"
  color: string             ← HEX "#6366F1"
  order: number             ← порядок отображения
  quarterId: Id<"quarters">
  Индексы: by_quarter, by_user_quarter

tasks
  _id: Id<"tasks">
  userId: Id<"users">
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "done" | "blocked"
  streamId: Id<"streams">
  quarterId: Id<"quarters">
  weekNumber: number        ← 1–13
  orderInCell: number       ← порядок в ячейке Roadmap
  orderInWeek: number       ← порядок в колонке Weekly
  Индексы: by_quarter, by_stream_week, by_quarter_week
```

### 3.3 Серверные функции (convex/)

| Модуль | Тип | Функция | Описание |
|--------|-----|---------|----------|
| `quarters` | query | `list` | Все кварталы пользователя, sorted |
| `quarters` | query | `getActive` | Активный квартал через userSettings |
| `quarters` | mutation | `add` | Создать + установить активным + seed 3 streams |
| `quarters` | mutation | `remove` | Удалить + каскад: streams + tasks |
| `quarters` | mutation | `setActive` | Сменить активный квартал |
| `quarters` | mutation | `seed` | Идемпотентный init для нового пользователя |
| `streams` | query | `listByQuarter` | Стримы квартала, sorted by order |
| `streams` | mutation | `add` | Создать (order = count existing) |
| `streams` | mutation | `update` | Обновить name/color |
| `streams` | mutation | `remove` | Удалить + каскад: tasks |
| `streams` | mutation | `reorder` | Batch-обновление order |
| `streams` | mutation | `seed` | Создать 3 дефолтных стрима |
| `tasks` | query | `listByStreamWeek` | Задачи ячейки Roadmap (stream × week) |
| `tasks` | query | `listByQuarterWeek` | Задачи недели для Weekly view |
| `tasks` | query | `getById` | Одна задача (для модалки редактирования) |
| `tasks` | mutation | `add` | Создать (server-side вычисление orderInCell/orderInWeek) |
| `tasks` | mutation | `update` | Обновить поля |
| `tasks` | mutation | `remove` | Удалить |
| `tasks` | mutation | `updateStatus` | Сменить статус (drag-and-drop) |
| `tasks` | mutation | `reorderInWeek` | Batch-обновление orderInWeek |
| `userSettings` | query | `get` | Настройки пользователя |
| `userSettings` | mutation | `setActiveQuarter` | Upsert activeQuarterId |

### 3.4 Frontend-архитектура

```
src/
├── main.tsx                 — ConvexReactClient + ConvexAuthProvider
├── App.tsx                  — Auth gate (useConvexAuth) + AuthenticatedApp + seed()
├── types/index.ts           — Doc<T>/Id<T> из convex/_generated/dataModel
│
├── hooks/
│   ├── useConvexQuarters.ts — useQuery(api.quarters.*) + useMutation
│   ├── useConvexStreams.ts  — useQuery(api.streams.*) + useMutation
│   ├── useConvexTasks.ts   — useQuery/useMutation для задач
│   ├── useCurrentWeek.ts   — текущая неделя квартала
│   └── useWeekTasks.ts     — задачи недели, сгруппированные по стримам
│
├── store/
│   └── uiStore.ts          — Zustand: модалки, editingIds, selectedWeek (НЕ persisted)
│
└── components/
    ├── auth/
    │   └── AuthScreen.tsx  — Email+пароль регистрация/вход
    ├── ui/
    │   ├── Loading.tsx     — Fullscreen спиннер
    │   ├── Modal.tsx       — Базовая модалка
    │   ├── ColorPicker.tsx, PriorityBadge.tsx, PrioritySelector.tsx, StatusPill.tsx
    ├── roadmap/
    │   ├── RoadmapGrid.tsx — Таблица стримы×недели
    │   ├── RoadmapCell.tsx — Ячейка: задачи + кнопка "+"
    │   └── TaskCard.tsx    — Карточка задачи
    ├── weekly/
    │   └── WeeklyView.tsx  — Kanban с DnD
    └── modals/
        ├── TaskModal.tsx, StreamModal.tsx, QuarterModal.tsx
```

---

## 4. Функциональность

### 4.1 Авторизация
- Регистрация: email + пароль (минимум 8 символов)
- Вход в существующий аккаунт
- Выход (Sign out) — кнопка в хедере
- Сессия сохраняется в localStorage браузера через @convex-dev/auth
- Данные каждого пользователя полностью изолированы: `userId` присутствует в каждой таблице и проверяется в каждой серверной функции

### 4.2 Онбординг новых пользователей
При первом входе `quarters.seed` автоматически создаёт:
- Квартал текущего периода (например, Q1 2026) с правильной `startDate`
- 3 дефолтных стрима: Backend (#6366F1), Frontend (#EC4899), Design (#10B981)
- Устанавливает квартал как активный в `userSettings`
- Мутация идемпотентна — повторные вызовы безопасны

### 4.3 Управление кварталами
- Переключение через кнопку в хедере (метка активного квартала + ▾)
- Создание: выбор года (±1 от текущего) + квартала (Q1–Q4)
- При создании: квартал автоматически становится активным + seeding стримов
- Удаление квартала: каскадное удаление всех стримов и задач (атомарная мутация на сервере)

### 4.4 Roadmap (дорожная карта)
- Таблица: строки = стримы, столбцы = недели 1–13
- Суб-навигация: Quarter (все 13 недель, col 110px) | Jan | Feb | Mar (4–5 недель, col 160px)
- Текущая неделя: индиго фон + точка в заголовке
- Sticky левая колонка при горизонтальном скролле
- Клик на заголовок недели → переход в Weekly на эту неделю
- Ячейки: список задач + кнопка "+" для создания

### 4.5 Стримы (рабочие потоки)
- Создание через "+ Stream" в хедере
- Редактирование: имя + цвет (12 предустановленных)
- Удаление: каскадное удаление задач (на сервере, одна мутация)
- Инлайн-создание из модалки задачи

### 4.6 Задачи
- Создание из Roadmap или Weekly
- Поля: заголовок, описание, приоритет, статус, стрим, неделя
- Прекриплнение при открытии модалки: streamId + weekNumber (из Roadmap) / weekNumber + status (из Weekly)
- Сервер вычисляет `orderInCell` и `orderInWeek` атомарно
- Удаление с `confirm()` в модалке

### 4.7 Weekly View (недельный трекер)
- Kanban: 4 колонки — TODO | IN PROGRESS | DONE | BLOCKED
- Drag-and-drop: смена статуса (между колонками) + reorder (внутри колонки)
- Optimistic UI: локальный state `columns` обновляется мгновенно, мутация — fire-and-forget
- Прогресс: "X of N done" + прогресс-бар
- Метки Past/Future для не-текущих недель
- Кнопка "Current week (WN)" при просмотре другой недели

---

## 5. Переменные окружения

### Фронтенд (.env.local — НЕ коммитить в git)
```
CONVEX_DEPLOYMENT=dev:doting-mink-769
VITE_CONVEX_URL=https://doting-mink-769.eu-west-1.convex.cloud
VITE_CONVEX_SITE_URL=https://doting-mink-769.eu-west-1.convex.site
```

### Convex (серверные — устанавливаются через Dashboard / CLI)
```
AUTH_SECRET      — подпись auth-токенов (openssl rand -hex 32)
JWT_PRIVATE_KEY  — RSA приватный ключ для JWT (npx @convex-dev/auth)
JWKS             — JWK Set (публичный ключ для верификации JWT)
SITE_URL         — URL фронтенда (для CORS и auth коллбеков)
```

---

## 6. Запуск и деплой

### Первый запуск (новая машина)

```bash
# 1. Установить зависимости
npm install

# 2. Подключить Convex (если .env.local отсутствует):
npx convex dev --configure existing \
  --team rinat-rysaev-dc210 \
  --project tracker

# 3. Настроить ключи авторизации (если ещё не настроено):
npx @convex-dev/auth
npx convex env set AUTH_SECRET $(openssl rand -hex 32)

# 4. Запустить
npx convex dev   # терминал 1: Convex backend (watch mode)
npm run dev      # терминал 2: Vite frontend → http://localhost:5173
```

### Ежедневная разработка

```bash
npx convex dev   # терминал 1
npm run dev      # терминал 2
```

### Продакшн деплой

```bash
# Backend
npx convex deploy

# Frontend (сборка)
npm run build
# Загрузить dist/ на Vercel / Netlify / любой статик-хост
# Указать VITE_CONVEX_URL = prod-URL из Convex Dashboard
```

---

## 7. UI-компоненты и дизайн-система

### Компоненты (`src/components/ui/`)

| Компонент | Описание | Props |
|-----------|----------|-------|
| `Loading` | Fullscreen спиннер при загрузке auth/данных | — |
| `Modal` | Портальная модалка (bottom-sheet на мобиле) | `open, onClose, wide?` |
| `ColorPicker` | 12 цветных круглых кнопок | `selected, onSelect` |
| `PrioritySelector` | 3 кнопки Low/Medium/High | `value, onChange` |
| `PriorityBadge` | Inline-badge приоритета | `priority` |
| `StatusPill` | Кликабельная пилюля статуса | `status, onChange` |

### Палитра цветов стримов (12 цветов)
```
#6366F1 индиго    #EC4899 розовый    #10B981 изумрудный  #F59E0B янтарный
#3B82F6 синий     #EF4444 красный    #8B5CF6 фиолетовый  #14B8A6 бирюзовый
#F97316 оранжевый #84CC16 лайм       #06B6D4 циан         #A855F7 пурпурный
```

### Дизайн-система
- **Primary:** Indigo — акценты, кнопки, активные элементы
- **Semantic:** зелёный (done/low), жёлтый (in-progress/medium), красный (blocked/high)
- **Радиусы:** rounded-xl (кнопки/поля), rounded-2xl (модалки/карточки kanban), rounded-md (карточки roadmap)
- **Модалки:** bottom-sheet на мобиле (`items-end`), центр на десктопе (`sm:items-center`)
- **Roadmap:** горизонтальный скролл, sticky левая колонка

---

## 8. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2026-03-08 | Frontend-only. React + Zustand + localStorage. Roadmap + Weekly. |
| 1.1 | 2026-03-08 | Фикс: выравнивание колонок Roadmap в месячных видах (убрано hardcode min-w). |
| 2.0 | 2026-03-10 | **Клиент-серверная архитектура.** Convex.dev backend. Email+пароль auth (@convex-dev/auth). Данные изолированы по пользователям на сервере. Real-time синхронизация. |

---

## 9. Известные ограничения (v2.0)

1. **Нет drag-and-drop на Roadmap** — только на Weekly view
2. **Нет фильтрации/поиска** — нельзя искать задачи
3. **Статус меняется только через DnD** — нет кнопки в модалке
4. **Нет undo/redo** — удаления необратимы
5. **Один user per deployment** — нет приглашений / совместной работы
