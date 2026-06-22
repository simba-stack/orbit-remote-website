# Releases

Сюда складываются собранные дистрибутивы, которые отдаёт сайт через `/download/:platform`.

## Как опубликовать новый релиз

1. Соберите дистрибутивы:
   - Windows: `OrbitRemote-Setup.exe`
   - Android: `orbit-remote-release.apk`
2. Скопируйте файлы в эту папку (`releases/`).
3. Обновите `releases.json`, указав реальные значения:

```json
{
  "product": "Orbit Remote",
  "updated": "2026-06-22",
  "platforms": {
    "windows": {
      "version": "1.0.0",
      "file": "OrbitRemote-Setup.exe",
      "size": 48234567,
      "sha256": "<контрольная сумма>",
      "minOs": "Windows 10 (64-bit)"
    },
    "android": {
      "version": "1.0.0",
      "file": "orbit-remote-release.apk",
      "size": 18234567,
      "sha256": "<контрольная сумма>",
      "minOs": "Android 8.0 (API 26)"
    }
  }
}
```

Размер файла (`size`) можно получить так:

```bash
stat -c %s releases/orbit-remote-release.apk     # Linux
```

Контрольную сумму SHA‑256:

```bash
sha256sum releases/orbit-remote-release.apk      # Linux
certutil -hashfile releases\OrbitRemote-Setup.exe SHA256   # Windows
```

Сервер читает `releases.json` при каждом запросе, поэтому перезапуск не требуется —
достаточно положить файлы и обновить манифест. Кнопки скачивания на сайте станут
активными автоматически, как только файл появится на диске.

> Бинарные файлы (`*.exe`, `*.apk`) не коммитятся в git — см. `.gitignore`.
> Для публикации больших файлов на Railway используйте volume или внешнее
> хранилище (S3/R2) и проксируйте ссылку через `/download`.
