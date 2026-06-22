# Деплой сайта Orbit Remote на Railway

> Файлы проекта готовы и проверены (сервер, лендинг, конфиг Railway, тесты).
> Эти шаги выполняются **на вашем компьютере** — git и Railway требуют входа
> в ваши аккаунты, доступа к которым у ассистента нет.

## 0. Удалить служебную папку .git (если есть)

В этой папке могла остаться неполная папка `.git`, созданная в песочнице.
Удалите её перед инициализацией репозитория:

```powershell
# PowerShell, находясь в папке website
Remove-Item -Recurse -Force .git
```

## 1. Создать репозиторий и первый коммит

```powershell
cd "C:\Users\sycev\OneDrive\Desktop\Remote Controle\website"
git init
git add .
git commit -m "Orbit Remote website: initial Railway-ready build"
git branch -M main
```

## 2. Запушить на GitHub

Создайте пустой репозиторий на github.com, затем:

```powershell
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## 3. Развернуть на Railway

### Вариант A — из GitHub (рекомендуется)
1. railway.app → **New Project** → **Deploy from GitHub repo**.
2. Выберите репозиторий.
3. Если сайт лежит в подпапке `website/`, в Settings сервиса задайте
   **Root Directory = website**.
4. Railway прочитает `railway.json` + `Dockerfile`, соберёт и запустит.
5. Settings → **Networking** → **Generate Domain** — получите публичный URL.

### Вариант B — через Railway CLI
```powershell
npm i -g @railway/cli
railway login
railway init
railway up
railway domain
```

## 4. Проверка
Откройте выданный домен — должен открыться лендинг.
Healthcheck: `https://<домен>/api/health` → `{"status":"ok",...}`.

## Публикация APK / EXE
См. `releases/README.md`. Кладёте файл в `releases/`, прописываете версию,
размер и SHA-256 в `releases.json` — кнопки скачивания активируются сами.
Большие бинарники не храните в git: используйте Railway Volume или S3/R2.
