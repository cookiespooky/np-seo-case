# SEO кейс: Услуги × Города (Notepub)

Статический SEO-проект на Notepub:

- 10 услуг
- 15 городов
- 150 страниц `город + услуга`
- блог на 20 статей с пагинацией
- деплой на GitHub Pages через GitHub Actions

## URL-структура

- `/`
- `/services/`
- `/services/{serviceSlug}/`
- `/cities/`
- `/cities/{citySlug}/`
- `/{citySlug}/{serviceSlug}/`
- `/blog/`
- `/blog/page/2/`
- `/blog/{articleSlug}/`
- `/about-project/`
- `/sitemap.xml`, `/robots.txt`, `/404.html`

## Данные

- `data/site.json` — `siteUrl`, `basePath`, бренд
- `data/services.json` — услуги
- `data/cities.json` — города
- `data/articles.json` — статьи

## Генерация и сборка

```bash
node scripts/generate-content.mjs
NOTEPUB_BIN=/path/to/notepub ./scripts/build.sh
```

Сборка делает:

1. генерацию markdown-контента (~202 страницы)
2. `notepub index/build`
3. копию `dist/404/index.html -> dist/404.html`
4. генерацию `robots.txt`

## GitHub Pages и переменные

Workflow: `.github/workflows/deploy.yml`

Поддерживаемые repository variables:

- `SITE_URL` (пример: `https://cookiespooky.github.io/np-seo-case/`)
- `BASE_PATH` (пример: `/np-seo-case/`)

Если переменные не заданы, workflow вычисляет значения автоматически из `owner/repo`.

## SEO

- absolute canonical на всех страницах
- `title`/`description` по типам страниц
- OpenGraph/Twitter (fallback + варианты для `city_service` и `article`)
- JSON-LD:
  - `BreadcrumbList` для `service`, `city`, `city_service`, `article`
  - `Article` для статей
  - `LocalBusiness + Service + FAQPage` для `city_service`
- `sitemap.xml` включает индексируемые страницы
- пагинация блога исключена из sitemap
- `404.html` с `noindex, follow`

## Как добавить город/услугу

1. Добавить запись в `data/cities.json` или `data/services.json`.
2. Пересобрать контент: `node scripts/generate-content.mjs`.
3. Пересобрать сайт: `./scripts/build.sh`.
