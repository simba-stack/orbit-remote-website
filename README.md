# Orbit Remote — Website

Сайт-витрина и портал загрузки для **Orbit Remote** — собственного аналога AnyDesk
для удалённого управления Android-устройствами. Это **отдельный проект** (сайт),
который разворачивается на Railway независимо от Android-агента, Windows-клиента и
сигнального сервера.

## Что внутри

```
website/
├── src/
│   └── server.js          # Express-сервер: статика, /api/releases, /download/:platform, /api/health
├── public/
│   ├── index.html         # Лендинг (тёмная/светлая тема)
│   ├── styles.css         # Стили
│   ├── app.js             # Переключение темы + подгрузка данных о релизах
│   ├── 404.html           # Страница 404
│   └── favicon.svg
├── releases/
│   ├── releases.json      # Манифест версий (читается на каждый запрос)
│   └── README.md          # Как публиковать сборки
├── Dockerfile             # Сборка контейнера (используется Railway)
├── railway.json           # Конфигурация деплоя Railway
├── .env.example
├── .dockerignore
├── .gitignore
└── package.json
```

## Локальный запуск

```bash
cd website
npm install
npm start
# открыть http://localhost:3000
```

Для разработки с авто-перезапуском: `npm run dev` (Node 18+).

## Эндпоинты

| Метод | Путь                   | Назначение                                            |
|-------|------------------------|-------------------------------------------------------|
| GET   | `/`                    | Лендинг                                               |
| GET   | `/api/health`          | Healthcheck (используется Railway и Docker)           |
| GET   | `/api/releases`        | JSON со списком платформ, версий и доступности файлов |
| GET   | `/download/:platform`  | Скачивание сборки (`windows` или `android`)           |

Пока бинарный файл не положен в `releases/`, эндпоинт `/download` возвращает 404 с
понятным сообщением, а кнопки на сайте показывают «Сборка готовится к публикации».
Это honest-поведение, а не заглушка: как только появится реальный файл и запись в
`releases.json`, всё активируется автоматически.

## Деплой на Railway

### Вариант A — через GitHub (рекомендуется)

1. Запушьте репозиторий в GitHub (см. ниже).
2. На [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Выберите репозиторий. Если сайт лежит в подпапке `website/`, укажите её как
   **Root Directory** в настройках сервиса (Settings → Root Directory → `website`).
4. Railway прочитает `railway.json` и `Dockerfile`, соберёт и задеплоит сервис.
5. Settings → **Networking** → **Generate Domain**, чтобы получить публичный URL.

Переменную `PORT` Railway задаёт сам — менять не нужно. `HOST=0.0.0.0` уже
зашит в Dockerfile.

### Вариант B — через Railway CLI

```bash
npm i -g @railway/cli
railway login
cd website
railway init            # создать новый проект
railway up              # собрать и задеплоить из текущей папки
railway domain          # выдать публичный домен
```

### Git: первый push

```bash
cd "Remote Controle"          # корень репозитория
git init
git add .
git commit -m "Orbit Remote website: initial Railway-ready build"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## Публикация сборок (APK / EXE)

См. `releases/README.md`. Кратко: положить файл в `releases/`, прописать версию,
размер и SHA‑256 в `releases.json`. Большие бинарники не хранятся в git — для
production используйте Railway Volume или внешнее хранилище (S3 / Cloudflare R2).

## Безопасность

Сервер отдаёт заголовки безопасности через **helmet** (включая CSP), gzip-сжатие
через **compression** и логирование запросов через **morgan**.
