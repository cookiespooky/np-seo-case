#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dataDir = path.join(root, "data");
const contentDir = path.join(root, "content");
const generatedDir = path.join(contentDir, "generated");

const site = readJson("site.json");
const services = readJson("services.json");
const cities = readJson("cities.json");
const articles = readJson("articles.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function cityIn(city) {
  return city.nameIn || city.name;
}

function route(p) {
  const normalized = p.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${site.basePath}${normalized}/`.replace(/\/+/g, "/");
}

function money(v) {
  return Math.round(v / 100) * 100;
}

function articleDate(index) {
  const d = new Date(Date.UTC(2025, 1, 5));
  d.setUTCDate(d.getUTCDate() + index * 13);
  return d.toISOString().slice(0, 10);
}

function fm(obj) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      lines.push(`${k}: \"${v.replace(/\"/g, '\\\"')}\"`);
    } else if (typeof v === "boolean") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function ensureCleanGenerated() {
  fs.rmSync(generatedDir, { recursive: true, force: true });
  fs.mkdirSync(generatedDir, { recursive: true });
  for (const f of fs.readdirSync(contentDir)) {
    if (f.endsWith(".md")) fs.rmSync(path.join(contentDir, f));
  }
}

function writePage(name, frontmatter, body) {
  fs.writeFileSync(path.join(generatedDir, name), `${fm(frontmatter)}${body.trim()}\n`, "utf8");
}

function pickArticles(seed, count) {
  const out = [];
  let idx = seed % articles.length;
  while (out.length < count) {
    const item = articles[idx % articles.length];
    if (!out.includes(item)) out.push(item);
    idx += 3;
  }
  return out;
}

function faqFor(city, service, min, max, variant) {
  const extra = variant % 2 === 0
    ? `Цена обычно зависит от площади, состояния помещения и объема подготовительных операций.`
    : `На итог влияют доступность объекта, сложность узлов и требуемые сроки выполнения.`;

  return [
    {
      q: `Сколько стоит ${service.name.toLowerCase()} в ${cityIn(city)}?`,
      a: `Ориентировочный диапазон по каталогу: от ${min.toLocaleString("ru-RU")} до ${max.toLocaleString("ru-RU")} ₽. ${extra}`
    },
    {
      q: `Какие сроки выполнения работ в ${cityIn(city)}?`,
      a: `Сроки рассчитываются после уточнения объема и условий доступа. Для типовых заказов план работ согласовывается на старте.`
    },
    {
      q: `Что входит в базовый состав работ по услуге «${service.name}»?`,
      a: `Базовый пакет включает ключевые операции по услуге, расходные материалы первой необходимости и контроль результата по чек-листу.`
    },
    {
      q: `Можно ли заказать выезд и предварительную оценку?`,
      a: `Да, оценка параметров объекта проводится до фиксации сметы, чтобы согласовать стоимость и календарный план.`
    },
    {
      q: `Есть ли гарантия на выполненные работы?`,
      a: `Да, гарантийные условия зависят от типа услуги и фиксируются в документах заказа.`
    }
  ];
}

ensureCleanGenerated();

const nowIso = new Date().toISOString().slice(0, 10);
const topQuickLinks = [
  ["moskva", "remont-kvartir"],
  ["moskva", "remont-vannoj"],
  ["moskva", "uslugi-elektrika"],
  ["moskva", "zamena-okon"],
  ["spb", "remont-kvartir"],
  ["spb", "ukladka-plitki"],
  ["spb", "ustanovka-santehniki"],
  ["spb", "natyazhnye-potolki"],
  ["kazan", "remont-kvartir"],
  ["kazan", "klining-kvartir"],
  ["ekaterinburg", "uslugi-elektrika"],
  ["novosibirsk", "ustanovka-dverej"],
  ["krasnodar", "sborka-mebeli"],
  ["samara", "zamena-okon"],
  ["ufa", "remont-vannoj"],
  ["perm", "ukladka-plitki"]
];

const latestArticles = [...articles]
  .map((a, i) => ({ ...a, date: articleDate(i) }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

writePage(
  "home.md",
  {
    type: "home",
    slug: "home",
    title: "Бытовые услуги по городам России — каталог",
    description:
      "Каталог бытовых и ремонтных услуг в городах России. Структура «услуга × город», блог и справочные материалы.",
    og_variant: "default",
    page_kind: "home"
  },
  `
> **Демонстрационный SEO-кейс**
>
> ~200 страниц: 10 услуг × 15 городов + блог.
> Статическая сборка без CMS и серверов.
> Развёрнут на GitHub Pages.
>
> [Подробнее о структуре проекта →](${route("about-project")})

# Бытовые услуги для дома в городах России

Каталог бытовых и ремонтных услуг в крупнейших городах России.
Страницы структурированы по модели «услуга × город»
и охватывают ключевые направления домашнего сервиса.

## Популярные услуги

${services.map((service) => `- [${service.name}](${route(`services/${service.slug}`)})`).join("\n")}

## Популярные города

${cities.map((city) => `- [${city.name}](${route(`cities/${city.slug}`)})`).join("\n")}

## Услуга в городе

${topQuickLinks
  .map(([citySlug, serviceSlug]) => {
    const city = cities.find((c) => c.slug === citySlug);
    const service = services.find((s) => s.slug === serviceSlug);
    return `- [${service.name} в ${cityIn(city)}](${route(`${citySlug}/${serviceSlug}`)})`;
  })
  .join("\n")}

## Последние статьи

${latestArticles
  .slice(0, 6)
  .map((article) => `- [${article.title}](${route(`blog/${article.slug}`)}) — ${article.date}`)
  .join("\n")}

[Все статьи →](${route("blog")})

## О каталоге

Выбор подрядчика для ремонта или бытовых работ зависит от множества факторов:
стоимости, сроков, квалификации специалистов и специфики региона.
В каталоге представлены основные направления услуг — от ремонта квартир
до клининга и установки дверей — с разбивкой по городам.
Такая структура позволяет быстро находить информацию
по конкретному типу услуги в выбранном регионе.

Для каждой комбинации «город + услуга» предусмотрена отдельная страница
с описанием работ, ориентировочными ценами и ответами на типовые вопросы.
Это упрощает навигацию и делает структуру сайта предсказуемой
как для пользователей, так и для поисковых систем.
`
);

writePage(
  "about-project.md",
  {
    type: "page",
    slug: "about-project",
    title: "О проекте",
    description: "Техническое описание SEO-кейса «услуги × города».",
    og_variant: "default",
    page_kind: "about"
  },
  `
# О проекте

Это демонстрационный SEO-кейс для статического сайта с матричной структурой «услуга × город».
Цель проекта: показать масштабируемую архитектуру страниц без CMS и серверной логики.

## Структура и формула масштабирования

- Формула: 10 услуг × 15 городов = 150 целевых страниц.
- Дополнительно: главная, списки услуг и городов, 20 статей блога, пагинация блога, техстраницы.
- Суммарно: около 200 URL.

## Метрики

- Количество страниц: **202** (текущая сборка).
- Build time: **~3.7 сек** на локальной машине (Notepub + генерация контента).
- Средний вес HTML: **~9.3 KB**.
- Lighthouse: **плановый замер на типовых страницах после деплоя**.

## Как добавить новый город или услугу

1. Обновите ` + "`data/cities.json`" + ` или ` + "`data/services.json`" + `.
2. Запустите ` + "`node scripts/generate-content.mjs`" + `.
3. Соберите сайт: ` + "`./scripts/build.sh`" + `.

Контакты и бренд в проекте демонстрационные и используются только для макета.
Репозиторий проекта можно публиковать в GitHub Pages и переключить на кастомный домен через переменную ` + "`SITE_URL`" + `.
`
);

writePage(
  "services-index.md",
  {
    type: "page",
    slug: "services",
    title: "Услуги",
    description: "Каталог услуг с переходом к страницам по городам.",
    og_variant: "default",
    page_kind: "services_list"
  },
  `
# Услуги

Ниже перечислены доступные направления услуг. На каждой странице услуги есть переходы по всем городам каталога.

${services.map((service) => `- [${service.name}](${route(`services/${service.slug}`)})`).join("\n")}
`
);

writePage(
  "cities-index.md",
  {
    type: "page",
    slug: "cities",
    title: "Города",
    description: "Города каталога с переходами к услугам.",
    og_variant: "default",
    page_kind: "cities_list"
  },
  `
# Города

Каталог городов, для каждого доступен полный список услуг и переходы к целевым страницам.

${cities.map((city) => `- [${city.name}](${route(`cities/${city.slug}`)})`).join("\n")}
`
);

services.forEach((service) => {
  writePage(
    `service-${service.slug}.md`,
    {
      type: "page",
      slug: `services/${service.slug}`,
      title: `${service.name} — описание, цены, ответы на вопросы`,
      description: `Страница услуги «${service.name}»: описание работ, диапазон стоимости и переходы по городам.`,
      page_kind: "service",
      service_slug: service.slug,
      service_name: service.name,
      og_variant: "default"
    },
    `
# ${service.name}

Раздел содержит базовую информацию по услуге и ссылки на все города каталога.

## ${service.name} по городам

${cities.map((city) => `- [${service.name} в ${cityIn(city)}](${route(`${city.slug}/${service.slug}`)})`).join("\n")}

## Коротко о стоимости

Ориентировочный диапазон по каталогу: от ${service.baseMin.toLocaleString("ru-RU")} до ${service.baseMax.toLocaleString("ru-RU")} ₽
(до применения региональных коэффициентов).
`
  );
});

cities.forEach((city) => {
  writePage(
    `city-${city.slug}.md`,
    {
      type: "page",
      slug: `cities/${city.slug}`,
      title: `Услуги в ${cityIn(city)} — каталог`,
      description: `Каталог бытовых и ремонтных услуг в ${cityIn(city)}.`,
      page_kind: "city",
      city_slug: city.slug,
      city_name: city.name,
      city_name_in: cityIn(city),
      og_variant: "default"
    },
    `
# Услуги в ${cityIn(city)}

${city.region ? `Регион: ${city.region}.` : ""}
На странице представлены все услуги, доступные для города.

${services.map((service) => `- [${service.name} в ${cityIn(city)}](${route(`${city.slug}/${service.slug}`)})`).join("\n")}
`
  );
});

cities.forEach((city, cIndex) => {
  services.forEach((service, sIndex) => {
    const min = money(service.baseMin * city.multiplier);
    const max = money(service.baseMax * city.multiplier);

    const cityLinks = [];
    for (let i = 1; i <= 7; i += 1) cityLinks.push(cities[(cIndex + i) % cities.length]);
    const pickedArticles = pickArticles(cIndex + sIndex * 5, 3);
    const faq = faqFor(city, service, min, max, cIndex + sIndex);

    writePage(
      `city-service-${city.slug}-${service.slug}.md`,
      {
        type: "page",
        slug: `${city.slug}/${service.slug}`,
        title: `${service.name} в ${cityIn(city)} — цены и услуги`,
        description: `${service.name} в ${cityIn(city)}: ориентировочные цены, состав работ и ответы на частые вопросы.`,
        page_kind: "city_service",
        city_slug: city.slug,
        city_name: city.name,
        city_name_in: cityIn(city),
        service_slug: service.slug,
        service_name: service.name,
        price_min: min,
        price_max: max,
        og_variant: "city_service"
      },
      `
# ${service.name} в ${cityIn(city)}

Услуга доступна в ${cityIn(city)}. Страница содержит ориентировочную стоимость,
структуру работ и базовые ответы на частые вопросы.

## Ориентировочные цены

- Минимальный диапазон: **от ${min.toLocaleString("ru-RU")} ₽**
- Верхний диапазон: **до ${max.toLocaleString("ru-RU")} ₽**
- Актуализация стоимости выполняется после оценки объема работ.

## Другие услуги в ${cityIn(city)}

${services.map((s) => `- [${s.name}](${route(`${city.slug}/${s.slug}`)})`).join("\n")}

## ${service.name} в других городах

${cityLinks.map((c) => `- [${service.name} в ${cityIn(c)}](${route(`${c.slug}/${service.slug}`)})`).join("\n")}

## Полезные статьи

${pickedArticles.map((article) => `- [${article.title}](${route(`blog/${article.slug}`)})`).join("\n")}

## FAQ

${faq.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n")}
`
    );
  });
});

const articlesWithDates = articles
  .map((article, index) => ({ ...article, date: articleDate(index) }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

writePage(
  "blog-index.md",
  {
    type: "page",
    slug: "blog",
    title: "Блог",
    description: "Материалы по выбору подрядчиков, ценам и организации бытовых работ.",
    page_kind: "blog",
    og_variant: "default"
  },
  `
# Блог

Статьи по выбору подрядчиков, оценке сметы, срокам и контролю качества работ.

${articlesWithDates.slice(0, 10).map((article, idx) => `${idx + 1}. [${article.title}](${route(`blog/${article.slug}`)}) — ${article.date}`).join("\n")}

[Следующая страница →](${route("blog/page/2")})
`
);

writePage(
  "blog-page-2.md",
  {
    type: "blog_page",
    slug: "blog/page/2",
    title: "Блог — страница 2",
    description: "Пагинация блога: архив материалов.",
    page_kind: "blog_page",
    og_variant: "default"
  },
  `
# Блог — страница 2

${articlesWithDates.slice(10, 20).map((article, idx) => `${idx + 11}. [${article.title}](${route(`blog/${article.slug}`)}) — ${article.date}`).join("\n")}

[← Назад к первой странице](${route("blog")})
`
);

articlesWithDates.forEach((article, idx) => {
  const city = cities[idx % cities.length];
  const service = services[(idx * 3) % services.length];
  const service2 = services[(idx * 3 + 4) % services.length];

  writePage(
    `article-${article.slug}.md`,
    {
      type: "article",
      slug: article.slug,
      title: article.title,
      description: `Практический материал: ${article.title.toLowerCase()}.`,
      date: article.date,
      page_kind: "article",
      og_variant: "article",
      city_slug: city.slug,
      city_name: city.name,
      city_name_in: cityIn(city),
      service_slug: service.slug,
      service_name: service.name,
      service_slug_alt: service2.slug,
      service_name_alt: service2.name,
      date_modified: nowIso
    },
    `
# ${article.title}

Категория: **${article.category}**. Дата публикации: **${article.date}**.

При планировании работ важно заранее определить объем задач, последовательность этапов
и критерии контроля результата. В реальных проектах на итоговый бюджет влияют
подготовительные работы, состояние помещения и требования по срокам.

Перед запуском работ рекомендуется фиксировать объем в смете,
проверять перечень материалов и согласовывать контрольные точки приемки.
Это снижает риск дополнительных расходов и упрощает коммуникацию с исполнителем.

Связанные разделы каталога:

- [${service.name} в ${cityIn(city)}](${route(`${city.slug}/${service.slug}`)})
- [${service2.name} в ${cityIn(city)}](${route(`${city.slug}/${service2.slug}`)})
- [${service.name}](${route(`services/${service.slug}`)})
- [Услуги в ${cityIn(city)}](${route(`cities/${city.slug}`)})
`
  );
});

writePage(
  "404.md",
  {
    type: "notfound",
    slug: "404",
    title: "Страница не найдена",
    description: "Ошибка 404",
    noindex: true,
    og_variant: "default",
    page_kind: "notfound"
  },
  `
# Страница не найдена

Запрошенный адрес отсутствует.

[Перейти на главную](${route("")})
`
);

console.log(`Generated markdown files: ${fs.readdirSync(generatedDir).filter((f) => f.endsWith(".md")).length}`);
