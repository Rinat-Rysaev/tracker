# Tracker — Product Requirements Document (PRD)

## 1. Обзор продукта

**Tracker** — веб-приложение для персональной продуктивности, совмещающее дорожную карту (Roadmap) и недельный трекер (Weekly Kanban). Пользователь планирует задачи на квартал через roadmap-сетку, а затем фокусируется на выполнении через kanban-доску для конкретной недели.

**Ключевая идея:** два представления одних и тех же данных — макро-обзор (квартальная дорожная карта) и микро-фокус (недельный kanban).

---

## 2. Технический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| UI-фреймворк | React | 19.2.0 |
| Язык | TypeScript | 5.9.3 |
| State management | Zustand | 5.0.11 |
| Стили | Tailwind CSS | 4.2.1 |
| Drag & Drop | @dnd-kit (core, sortable, utilities) | 6.3.1 / 10.0.0 / 3.2.2 |
| ID-генерация | nanoid | 5.1.6 |
| Сборщик | Vite | 7.3.1 |
| Линтер | ESLint | 9.39.1 |

**Архитектура:** SPA (Single Page Application), frontend-only. Данные хранятся в `localStorage` через Zustand persist middleware. Бэкенда нет.

---

## 3. Доменная модель

### 3.1 Quarter (Квартал)

13-недельный планировочный цикл — основная единица времени.

```typescript
interface Quarter {
  id: string           // nanoid (12 символов)
  label: string        // "Q1 2026"
  year: number         // 2026
  quarter: 1 | 2 | 3 | 4
  startDate: string    // ISO-дата понедельника первой недели, напр. "2026-01-05"
}
```

**Поведение:**
- При первом запуске приложения автоматически создаётся текущий квартал
- Пользователь может создавать дополнительные кварталы (выбор года + номера квартала)
- Один квартал всегда активный (`activeQuarterId`) — все представления показывают его данные
- Переключение между кварталами через модальное окно в хедере
- Удаление квартала каскадно удаляет все его стримы и задачи

### 3.2 WorkStream (Поток работ)

Направление деятельности — горизонтальная строка на roadmap.

```typescript
interface WorkStream {
  id: string           // nanoid
  name: string         // "Backend", "Frontend", "Design"
  color: string        // HEX-цвет, напр. "#6366F1"
  order: number        // порядок отображения (0, 1, 2...)
  quarterId: string    // привязка к кварталу
}
```

**Поведение:**
- При создании нового квартала автоматически создаются 3 стрима по умолчанию:
  - Backend (#6366F1, индиго)
  - Frontend (#EC4899, розовый)
  - Design (#10B981, зелёный)
- Пользователь может создавать, редактировать, удалять стримы
- Доступно 12 предопределённых цветов для выбора
- Создание стрима возможно inline из модалки задачи
- Удаление стрима каскадно удаляет все его задачи
- Порядок стримов определяет порядок строк в roadmap

### 3.3 Task (Задача)

Основная рабочая единица — карточка задачи.

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked'
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  streamId: string       // привязка к стриму
  quarterId: string      // привязка к кварталу
  weekNumber: number     // 1–13, неделя внутри квартала
  orderInCell: number    // порядок внутри ячейки roadmap (stream × week)
  orderInWeek: number    // порядок в kanban-колонке (для недели в целом)
  createdAt: number      // timestamp создания
  updatedAt: number      // timestamp последнего обновления
}
```

**Поведение:**
- Задача всегда привязана к конкретному стриму и неделе
- Новые задачи создаются со статусом `todo` (или предзаданным из контекста)
- Приоритет по умолчанию — `medium`
- Двойная система порядка:
  - `orderInCell` — порядок внутри ячейки roadmap (на пересечении стрима и недели)
  - `orderInWeek` — порядок в kanban-колонке weekly view
- Статус меняется только через drag-and-drop в weekly view
- Остальные поля меняются через модальное окно

---

## 4. Управление состоянием

### 4.1 Zustand Stores

Приложение использует 4 Zustand store:

#### `quarterStore` (persisted → `localStorage: tracker-quarters`)
| Метод | Описание |
|-------|----------|
| `addQuarter(data)` | Создать квартал |
| `updateQuarter(id, patch)` | Обновить квартал |
| `deleteQuarter(id)` | Удалить квартал (fallback на первый оставшийся) |
| `setActiveQuarter(id)` | Установить активный квартал |
| `getActiveQuarter()` | Получить активный квартал |
| `seed()` | Создать текущий квартал если нет ни одного |

#### `streamStore` (persisted → `localStorage: tracker-streams`)
| Метод | Описание |
|-------|----------|
| `addStream(data)` | Создать стрим (order = кол-во существующих) |
| `updateStream(id, patch)` | Обновить name/color |
| `deleteStream(id)` | Удалить стрим |
| `reorderStreams(quarterId, orderedIds)` | Batch-обновление порядка |
| `getStreamsForQuarter(quarterId)` | Стримы квартала, отсортированные по order |
| `seed(quarterId)` | Создать 3 стрима по умолчанию если нет |

#### `taskStore` (persisted → `localStorage: tracker-tasks`)
| Метод | Описание |
|-------|----------|
| `addTask(data)` | Создать задачу (с timestamps) |
| `updateTask(id, patch)` | Обновить поля |
| `deleteTask(id)` | Удалить задачу |
| `updateStatus(id, status)` | Сменить статус |
| `moveTask(id, toWeek, toStreamId)` | Переместить в другую неделю/стрим |
| `reorderInWeek(quarterId, week, orderedIds)` | Batch-обновление orderInWeek |
| `getTasksForCell(streamId, week)` | Задачи ячейки, sorted by orderInCell |
| `getTasksForWeek(quarterId, week)` | Задачи недели, sorted by orderInWeek |
| `deleteByStream(streamId)` | Каскадное удаление при удалении стрима |
| `deleteByQuarter(quarterId)` | Каскадное удаление при удалении квартала |

#### `uiStore` (НЕ persisted — чисто UI-состояние)
| Метод | Описание |
|-------|----------|
| `openTask(ctx, taskId?)` | Открыть модалку задачи (создание или редактирование) |
| `openStream(streamId?)` | Открыть модалку стрима |
| `openQuarter()` | Открыть модалку кварталов |
| `close()` | Закрыть любую модалку |
| `setSelectedWeek(week)` | Установить выбранную неделю для навигации |

**Состояние uiStore:**
- `modal: 'task' | 'stream' | 'quarter' | null`
- `editingTaskId: string | null` (null = создание, id = редактирование)
- `editingStreamId: string | null`
- `taskCtx: { streamId?, weekNumber, status? }` — контекст для пре-заполнения модалки
- `selectedWeek: number | null` — неделя при переходе из roadmap

### 4.2 Custom Hooks

#### `useCurrentWeek(): number`
Вычисляет текущий номер недели (1–13) относительно активного квартала.
Использует `getCurrentWeekNumber(startDate)` из date utils.

#### `useWeekTasks(weekNumber): WeekGroup[]`
Возвращает задачи для конкретной недели, сгруппированные по стримам.
```typescript
interface WeekGroup { stream: WorkStream; tasks: Task[] }
```
Фильтрует по `quarterId + weekNumber`, сортирует по `orderInWeek`, группирует по стримам, исключает пустые группы.

---

## 5. Структура интерфейса

### 5.1 Хедер (фиксированный, 56px)

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Tracker        [Roadmap | Week]        [+ Stream]│
│         Q1 2026 ▾                                       │
└─────────────────────────────────────────────────────────┘
```

- **Левая часть:** логотип (индиго квадрат с сеткой 2×2) + название "Tracker" + кнопка выбора квартала
- **Центр:** сегментный переключатель Roadmap / Week
- **Правая часть:** кнопка "+ Stream" (только на вкладке Roadmap)

### 5.2 Roadmap View (вкладка "Roadmap")

**Суб-навигация:**
```
[Quarter | Jan | Feb | Mar]
```
Переключает между просмотром всех 13 недель и конкретного месяца (4–5 недель).

**Сетка:**
```
           W1    W2    W3    W4    W5    ...  W13
┌─────────┬─────┬─────┬─────┬─────┬─────┬───┬─────┐
│ Backend │ [T] │     │ [T] │     │     │   │     │
│ ● ───── │ [T] │     │     │     │     │   │     │
├─────────┼─────┼─────┼─────┼─────┼─────┼───┼─────┤
│ Frontend│     │ [T] │     │ [T] │     │   │     │
│ ● ───── │     │     │     │ [T] │     │   │     │
├─────────┼─────┼─────┼─────┼─────┼─────┼───┼─────┤
│ Design  │     │     │     │     │ [T] │   │     │
│ ● ───── │     │     │     │     │     │   │     │
├─────────┼─────┼─────┼─────┼─────┼─────┼───┼─────┤
│ + Add   │     │     │     │     │     │   │     │
│  stream │     │     │     │     │     │   │     │
└─────────┴─────┴─────┴─────┴─────┴─────┴───┴─────┘
```

- **Строки:** стримы (Backend, Frontend, Design...) — левая колонка залипает при горизонтальном скролле (sticky)
- **Колонки:** недели W1–W13
- **Ячейки:** содержат карточки задач + кнопку "+"
- **Текущая неделя:** подсвечена индиго фоном + точкой в заголовке
- **Прошедшие недели:** приглушённый текст заголовка
- **Ширина колонок:** 110px в режиме Quarter, 160px в месячном режиме
- **Клик по заголовку недели (W5):** переход на Weekly view для этой недели

**Карточка задачи на Roadmap (TaskCard):**
```
┌───────────────────┐
│▎ Task title here  │  ← цветная полоска слева (статус)
│▎ that can be...   │
│▎ ○         ●      │  ← иконка статуса + точка приоритета
└───────────────────┘
```
- Левая полоска (3px): зелёная (done), красная (blocked/overdue in-progress), жёлтая (in-progress), серая (todo)
- Фон: зелёный (done), красный (blocked/overdue), жёлтый (in-progress), белый (todo)
- Заголовок: максимум 2 строки (line-clamp-2)
- Внизу: иконка статуса (○ ◐ ✓ ✕) и точка приоритета (зелёная/жёлтая/красная)
- Клик → открывает модалку редактирования задачи

### 5.3 Weekly View (вкладка "Week")

**Заголовок недели:**
```
Q1 2026 · Week 5 · past/future
12 фев – 18 фев
[═══════════30%══════         ] 3 of 10 done
```
- Номер квартала, неделя, метка (past/future если не текущая)
- Диапазон дат
- Прогресс-бар (% выполнения)
- Кнопка "Current week (W3)" если просматривается не текущая неделя

**Kanban-доска:**
```
┌──────────┬──────────┬──────────┬──────────┐
│ TODO     │ IN PROG  │ DONE     │ BLOCKED  │
│ ──── (3) │ ──── (2) │ ──── (1) │ ──── (0) │
│          │          │          │          │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │
│ │▎Task │ │ │▎Task │ │ │▎Task │ │ No tasks │
│ │▎desc │ │ │▎     │ │ │▎     │ │ click +  │
│ │▎BACK │ │ │▎FRON │ │ │▎BACK │ │          │
│ │▎Med  │ │ │▎High │ │ │▎Low  │ │          │
│ └──────┘ │ └──────┘ │ └──────┘ │          │
│ ┌──────┐ │ ┌──────┐ │          │          │
│ │▎Task │ │ │▎Task │ │          │          │
│ └──────┘ │ └──────┘ │          │          │
│          │          │          │          │
│ + Add    │ + Add    │ + Add    │ + Add    │
└──────────┴──────────┴──────────┴──────────┘
```

- **4 колонки:** Todo (серый), In Progress (синий), Done (зелёный), Blocked (красный)
- **Цветная линия** под названием колонки
- **Ширина колонки:** 288px (w-72)
- **Drag-and-drop:** перетаскивание карточек между колонками меняет статус
- **Reorder:** перетаскивание внутри колонки меняет порядок
- **Пустая колонка:** пунктирный бокс "No tasks · click + to add"
- **Кнопка "+ Add task"** внизу каждой колонки

**Kanban-карточка:**
```
┌───────────────────────────────┐
│▎ Task title here              │  ← цветная полоска стрима
│▎ Description preview...       │
│▎ BACKEND        Medium        │  ← имя стрима (цвет стрима) + приоритет badge
└───────────────────────────────┘
```
- Левая полоска (3px): цвет стрима
- Заголовок (зачёркнутый если done)
- Превью описания (truncate)
- Имя стрима (цвет стрима, uppercase, маленький шрифт)
- Badge приоритета (High/Medium/Low с цветами)
- Клик → модалка редактирования

**Drag-and-drop (технические детали):**
- Библиотека: @dnd-kit (DndContext + SortableContext + Droppable)
- Сенсоры: PointerSensor (активация после 5px движения) + KeyboardSensor
- Collision detection: closestCorners
- DragOverlay: карточка-призрак с тенью и наклоном (rotate-1)
- Optimistic update: локальный state `columns` обновляется во время drag, запись в store только на dragEnd
- Синхронизация: useEffect обновляет columns из store когда нет активного drag

### 5.4 Модальные окна

Все модалки используют единый компонент `<Modal>`:
- Портал в `document.body`
- Тёмный оверлей (rgba(0,0,0,0.45))
- Анимация появления (slideUp, 200ms)
- Закрытие: Escape / клик по оверлею
- Мобильный: прилипает к низу (rounded-t-2xl)
- Десктоп: центрирован (rounded-2xl), max-width 28rem (md) или 36rem (xl)
- Блокировка скролла страницы

#### Модалка задачи (TaskModal)
Режимы: создание / редактирование

**Поля:**
- Title (обязательное, input, Enter → save)
- Description (textarea, 3 строки)
- Priority (3 кнопки: Low/Medium/High, цветные)
- Week (13 кнопок: W1–W13, индиго при выборе)
- Stream (select-dropdown со всеми стримами + "Create new stream…")

**Inline-создание стрима:**
Если выбрать "Create new stream…":
- Появляется форма: input для имени + ColorPicker
- Кнопка "Create stream" → создаёт стрим, устанавливает в select

**Действия:**
- Create / Save (зависит от режима)
- Delete task (только в режиме редактирования, с confirm())

**Пре-заполнение:**
- При создании из RoadmapCell → предзаполняется streamId + weekNumber
- При создании из Weekly → предзаполняется weekNumber + status

#### Модалка стрима (StreamModal)
Режимы: создание / редактирование

**Поля:**
- Name (input, Enter → save)
- Color (ColorPicker — 12 круглых кнопок с цветами)

**Действия:**
- Create / Save
- Delete stream (с confirm(), каскадно удаляет все задачи)

#### Модалка кварталов (QuarterModal)
Два экрана: список / создание

**Экран списка:**
- Список всех кварталов (sorted by year, quarter)
- Активный квартал подсвечен (индиго фон, метка "active")
- Клик → переключает активный квартал
- Кнопка "+ New quarter" → переход на экран создания

**Экран создания:**
- Year (3 кнопки: прошлый/текущий/следующий год)
- Quarter (4 кнопки: Q1–Q4)
- Кнопка "Create Q1 2026" → создаёт, устанавливает активным, сидирует стримы
- Кнопка "← Back" → возврат к списку

---

## 6. UI-компоненты

### 6.1 Переиспользуемые компоненты (`src/components/ui/`)

| Компонент | Описание | Props |
|-----------|----------|-------|
| `Modal` | Портальное модальное окно | `open, onClose, children, wide?` |
| `ColorPicker` | 12 цветных круглых кнопок | `selected, onSelect` |
| `PrioritySelector` | 3 кнопки Low/Medium/High | `value, onChange` |
| `PriorityBadge` | Inline-badge приоритета | `priority` |
| `StatusPill` | Кликабельная пилюля статуса (циклит по статусам) | `status, onChange` |

### 6.2 Палитра цветов для стримов

12 предопределённых цветов:
- #6366F1 (индиго), #EC4899 (розовый), #10B981 (изумрудный), #F59E0B (янтарный)
- #3B82F6 (синий), #EF4444 (красный), #8B5CF6 (фиолетовый), #14B8A6 (бирюзовый)
- #F97316 (оранжевый), #84CC16 (лайм), #06B6D4 (циан), #A855F7 (пурпурный)

---

## 7. Утилиты

### 7.1 Дата-утилиты (`src/utils/date.ts`)

| Функция | Описание |
|---------|----------|
| `getQuarterForDate(date)` | Определяет год и номер квартала для даты |
| `getQuarterStartDate(year, q)` | ISO-дата понедельника первой недели квартала |
| `getCurrentWeekNumber(startDate)` | Текущий номер недели (1–13) от начала квартала |
| `getWeekDateRange(startDate, week)` | Человеческий формат: "12 фев – 18 фев" |
| `getQuarterLabel(year, q)` | "Q1 2026" |
| `getQuarterMonthGroups(quarter)` | Разбивает 13 недель на 3 месяца (для суб-навигации) |
| `createCurrentQuarter()` | Создаёт объект квартала для текущей даты |

**Особенности:**
- Неделя начинается с понедельника
- Если 1-е число месяца — не понедельник, берётся следующий понедельник
- Формат дат: русская локаль (`ru-RU`)

### 7.2 Генерация ID (`src/utils/id.ts`)

`generateId()` → nanoid(12) — 12-символьный алфанумерический ID.

---

## 8. Навигация и потоки данных

### 8.1 Навигация между представлениями

```
Roadmap ──[клик W5]──→ Weekly (week 5)
                         │
Weekly  ──[Current week]──→ Weekly (текущая неделя)
                         │
Weekly  ──[Tab: Roadmap]──→ Roadmap (сброс selectedWeek)
```

### 8.2 Инициализация приложения

```
App mount
  └── useEffect
       ├── quarterStore.seed() → создаёт текущий квартал если нет
       └── streamStore.seed(qId) → создаёт 3 стрима если нет
```

### 8.3 Жизненный цикл задачи

```
Создание (Roadmap "+" или Weekly "+ Add task")
  └── TaskModal (create mode)
       └── taskStore.addTask() → статус "todo"
            └── задача появляется в Roadmap и Weekly

Изменение статуса (Weekly drag-and-drop)
  └── onDragEnd → taskStore.updateStatus()
  └── onDragEnd → taskStore.reorderInWeek()

Редактирование (клик по карточке)
  └── TaskModal (edit mode)
       └── taskStore.updateTask() → title, desc, priority, week, stream

Удаление (через модалку)
  └── confirm() → taskStore.deleteTask()
```

### 8.4 Каскадные удаления

```
deleteQuarter(id)
  └── quarterStore.deleteQuarter() → удаляет квартал
  (+ отдельно вызвать deleteByQuarter для задач)

deleteStream(id)
  └── taskStore.deleteByStream() → удаляет все задачи стрима
  └── streamStore.deleteStream() → удаляет стрим
```

---

## 9. Структура файлов

```
tracker/
├── src/
│   ├── main.tsx                          # Точка входа (ReactDOM.createRoot)
│   ├── App.tsx                           # Корневой компонент (хедер, табы, модалки)
│   ├── index.css                         # Глобальные стили (Tailwind import)
│   │
│   ├── types/
│   │   └── index.ts                      # TypeScript типы (Task, WorkStream, Quarter)
│   │
│   ├── store/
│   │   ├── taskStore.ts                  # Zustand store задач (persisted)
│   │   ├── streamStore.ts               # Zustand store стримов (persisted)
│   │   ├── quarterStore.ts              # Zustand store кварталов (persisted)
│   │   └── uiStore.ts                   # Zustand store UI (не persisted)
│   │
│   ├── hooks/
│   │   ├── useCurrentWeek.ts            # Текущая неделя относительно активного квартала
│   │   └── useWeekTasks.ts              # Задачи недели, сгруппированные по стримам
│   │
│   ├── components/
│   │   ├── roadmap/
│   │   │   ├── RoadmapGrid.tsx          # Таблица-сетка (стримы × недели)
│   │   │   ├── RoadmapCell.tsx          # Ячейка сетки (карточки + кнопка "+")
│   │   │   └── TaskCard.tsx             # Компактная карточка задачи для roadmap
│   │   │
│   │   ├── weekly/
│   │   │   └── WeeklyView.tsx           # Kanban-доска (4 колонки + DnD)
│   │   │
│   │   ├── modals/
│   │   │   ├── TaskModal.tsx            # Создание/редактирование задачи
│   │   │   ├── StreamModal.tsx          # Создание/редактирование стрима
│   │   │   └── QuarterModal.tsx         # Управление кварталами
│   │   │
│   │   └── ui/
│   │       ├── Modal.tsx                # Базовый портальный модал
│   │       ├── ColorPicker.tsx          # Выбор цвета (12 вариантов)
│   │       ├── PriorityBadge.tsx        # Badge приоритета (inline)
│   │       ├── PrioritySelector.tsx     # Селектор приоритета (3 кнопки)
│   │       └── StatusPill.tsx           # Пилюля статуса (кликабельная)
│   │
│   └── utils/
│       ├── date.ts                      # Дата-утилиты (кварталы, недели, диапазоны)
│       ├── id.ts                        # Генерация ID (nanoid)
│       └── colors.ts                    # Палитра цветов для стримов
│
├── vite.config.ts                       # Vite + React + Tailwind CSS
├── tsconfig.app.json                    # TypeScript: ES2022, strict, react-jsx
├── tsconfig.json                        # Корневой TS config
├── package.json
├── index.html
└── dist/                                # Выход сборки
```

---

## 10. Дизайн-система

### Цвета
- **Primary:** Indigo (#6366F1 / indigo-600) — акцент, кнопки, активные элементы
- **Neutral:** Gray (gray-50 – gray-900) — фон, текст, границы
- **Semantic:**
  - Зелёный (green) — done, low priority
  - Жёлтый (amber) — in-progress, medium priority
  - Красный (red) — blocked, high priority, overdue, delete
  - Синий (blue) — in-progress (колонка kanban)

### Типографика
- Заголовки: font-bold, text-lg
- Labels: font-semibold, text-sm, text-gray-700
- Мелкий текст: text-[10px]–text-xs, uppercase, tracking-wider

### Скругления
- Карточки: rounded-md (roadmap) / rounded-xl (kanban)
- Кнопки: rounded-lg / rounded-xl
- Модалки: rounded-2xl (десктоп) / rounded-t-2xl (мобайл)

### Тени
- Карточки: shadow-sm → shadow-md (hover)
- Модалки: shadow-2xl
- Drag overlay: shadow-2xl + shadow-lg

### Адаптивность
- Модалки: bottom-sheet на мобильных (items-end), центрированы на десктопе (sm:items-center)
- Roadmap: горизонтальный скролл, sticky left column
- Weekly: горизонтальный скролл колонок

---

## 11. Ограничения текущей версии

1. **Однопользовательское** — данные только в localStorage одного браузера
2. **Нет синхронизации** — между устройствами/вкладками
3. **Нет бэкенда** — потеря данных при очистке localStorage
4. **Нет drag-and-drop на Roadmap** — только на Weekly view
5. **Нет фильтрации/поиска** — нельзя искать задачи
6. **Статус меняется только через DnD** — нет кнопки смены статуса в модалке задачи
7. **Нет undo/redo** — удаления необратимы
8. **Нет мобильной оптимизации** — roadmap сетка плохо работает на маленьких экранах
