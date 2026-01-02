# Lets Go Choose - React App

This project uses a flat file structure for simpler deployment on Vercel.

## 🚀 Инструкция по структуре файлов

**ВАЖНО:** Для корректной сборки на Vercel, убедитесь, что все файлы находятся в **корневой папке** репозитория (там же, где `package.json`).

Структура должна выглядеть так:
```
/App.tsx
/SpinWheel.tsx
/ImageCropper.tsx
/CatalogModal.tsx
/SavedListsModal.tsx
/constants.ts
/types.ts
/utils.ts
/index.html
/index.tsx
/vite.config.ts
/package.json
...
```

Не создавайте папку `components`! Все `.tsx` файлы должны лежать вместе.

## Деплой
1. Сохраните файлы.
2. Сделайте `git push`.
3. Vercel автоматически соберет проект.
