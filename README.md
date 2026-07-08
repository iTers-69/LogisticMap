# LogisticMap

Логистическая карта Казахстана: хабы, сёла, ветки маршрутов, построение дорог через OSRM.

**Данные синхронизируются через Supabase** — все пользователи видят одни и те же хабы, сёла и ветки. Локальный `localStorage` используется как кэш.

## Требования

- Node.js 20+
- npm 10+
- Аккаунт [Supabase](https://supabase.com) (бесплатно)
- Аккаунт [GitHub](https://github.com) + [Netlify](https://netlify.com) или [Vercel](https://vercel.com)

---

## Быстрый старт (локально)

### 1. Supabase (один раз)

1. Создайте проект на [supabase.com](https://supabase.com).
2. **SQL Editor** → вставьте содержимое `supabase/schema.sql` → **Run**.
3. **Table Editor** → таблица `app_state` → включите **Realtime**.
4. **Project Settings** → **API** → скопируйте URL и `anon` key.

### 2. Запуск

```bash
npm install
cp .env.example .env
# заполните переменные в .env (см. таблицу ниже)
npm run dev
```

Приложение: `http://localhost:5173`

При первом запуске (если облако пустое) загрузятся стартовые данные из `src/data/defaultAppData.json`.

---

## Деплой через Git (рекомендуется)

Схема: **ваш ПК → GitHub → Netlify/Vercel** (автосборка при каждом push).

### Шаг 1. Репозиторий на GitHub

В папке проекта (один раз):

```bash
git init
git add .
git commit -m "Initial commit: LogisticMap"
```

На GitHub: **New repository** → имя, например `logisticMap` → **без** README (он уже есть локально).

```bash
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/logisticMap.git
git push -u origin main
```

### Шаг 2. Netlify (проще всего — конфиг уже в `netlify.toml`)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → выберите репозиторий.
2. Netlify подхватит настройки из `netlify.toml`:
   - Build: `npm run build`
   - Publish: `dist`
3. **Site configuration** → **Environment variables** → добавьте:

| Переменная | Значение |
|---|---|
| `VITE_SUPABASE_URL` | URL из Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key из Supabase |
| `VITE_APP_LOGIN` | логин для команды |
| `VITE_APP_PASSWORD` | пароль (обязателен — без него сайт открыт) |
| `VITE_OSRM_URL` | `https://router.project-osrm.org/route/v1/driving` (можно не задавать — есть дефолт) |
| `VITE_BASE` | `/` (оставьте так для своего домена Netlify) |

4. **Deploy site**. После сборки сайт будет по адресу вида `https://ваш-сайт.netlify.app`.

> **Важно:** `.env` в git не попадает (см. `.gitignore`). Секреты задаются только в панели Netlify/Vercel.

### Альтернатива: Vercel

1. [vercel.com](https://vercel.com) → **Import Project** → GitHub → репозиторий.
2. Framework: **Vite**, build: `npm run build`, output: `dist`.
3. Те же **Environment variables**, что в таблице выше.
4. Конфиг SPA-маршрутов уже в `vercel.json`.

---

## Как заливать изменения в будущем

После правок в коде:

```bash
git add .
git status          # проверить, что .env не попал в список
git commit -m "Кратко: что изменили"
git push
```

Netlify/Vercel **сами пересоберут** сайт за 1–2 минуты. Новый деплой виден в панели хостинга.

Перед push полезно локально:

```bash
npm run build       # убедиться, что сборка проходит
npm run preview     # посмотреть prod-версию на localhost:4173
```

### Если меняли только данные в Supabase

Push **не нужен** — данные живут в облаке. Достаточно сохранить в приложении (автосинхронизация).

### Если меняли переменные окружения

В Netlify/Vercel: **Environment variables** → изменить → **Trigger deploy** (или новый push).

### Если меняли `defaultAppData.json` или Excel

1. `git push` (чтобы новый код/данные попали на сервер).
2. В приложении: импорт Excel или очистка `app_state` в Supabase для перезагрузки дефолтов.

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | Публичный anon-ключ Supabase |
| `VITE_APP_LOGIN` | Логин для входа |
| `VITE_APP_PASSWORD` | Пароль; если пустой — вход отключён |
| `VITE_BASE` | Базовый путь (`/` для Netlify/Vercel; `/logisticMap/` для GitHub Pages) |
| `VITE_OSRM_URL` | OSRM API для маршрутов по дорогам |

Без Supabase приложение работает только из `localStorage` (бейдж «Только локально»).

---

## Синхронизация данных

| Действие | Что происходит |
|---|---|
| Открытие сайта | Загрузка из Supabase → кэш в `localStorage` |
| Любое изменение | Автосохранение в Supabase (~1.2 сек) |
| Другой пользователь | Обновление через Realtime |
| Supabase недоступен | Работа из кэша, бейдж «Только локально» |

---

## Сборка

```bash
npm run build    # папка dist/
npm run preview  # просмотр prod-сборки
npm run lint     # ESLint (не блокирует деплой на Netlify)
```

---

## Обновление стартовых данных

```bash
npm run generate:default
```

Пересоздаёт `src/data/defaultAppData.json`. Чтобы применить для всех — импорт в приложении или очистка строки в Supabase `app_state`.

---

## Структура проекта

| Путь | Назначение |
|---|---|
| `src/` | React-приложение |
| `src/data/defaultAppData.json` | Стартовые хабы, сёла, ветки |
| `src/data/villageCoordinates.json` | Координаты сёл |
| `supabase/schema.sql` | Схема облачной БД |
| `netlify.toml` / `vercel.json` | Настройки деплоя |
| `tools/` | Скрипты геокодинга (не нужны на хостинге) |

---

## Чеклист перед первым деплоем

- [ ] Supabase: выполнен `schema.sql`, Realtime включён
- [ ] GitHub: репозиторий создан, код запушен
- [ ] Netlify/Vercel: переменные окружения заданы
- [ ] Локально: `npm run build` проходит без ошибок
- [ ] После деплоя: вход по логину/паролю, карта и синхронизация работают
