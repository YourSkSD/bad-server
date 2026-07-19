# Проектная работа «WebLarek. Плохой сервер», спринт 17

Аудит безопасности и устранение уязвимостей backend-приложения интернет-магазина Web-ларёк.

## Автор

- **Имя:** Давыдов Артур Ильдарович
- **Когорта:** 46
- **Курс:** Фуллстек-разработчик

## Ссылки

- **Репозиторий:** https://github.com/YourSkSD/bad-server
- **Опубликованная версия:** не публиковалось

## Запуск проекта

1. Клонировать репозиторий.
2. Создать файлы окружения (они в `.gitignore` и в репозиторий не попадают):

   `backend/.env`:
   ```
   PORT=3000
   DB_ADDRESS=mongodb://root:example@mongo:27017/weblarek?authSource=admin
   UPLOAD_PATH=images
   UPLOAD_PATH_TEMP=temp
   ORIGIN_ALLOW=http://localhost
   AUTH_ACCESS_TOKEN_SECRET=<случайная строка>
   AUTH_REFRESH_TOKEN_SECRET=<случайная строка>
   JWT_SECRET=<случайная строка>
   AUTH_ACCESS_TOKEN_EXPIRY=10m
   AUTH_REFRESH_TOKEN_EXPIRY=7d
   ```

   `frontend/.env`:
   ```
   VITE_API_ORIGIN=http://localhost/api
   ```

3. Запустить контейнеры:
   ```bash
   docker compose up -d
   ```
4. Наполнить базу данных из дампа (см. `.dump/README.md`). Пользователи в дампе
   уже с bcrypt-паролями:
   - админ — `admin@mail.ru` / `password`
   - покупатель — `user1@mail.ru` / `password1`
5. Открыть:
   - витрина — http://localhost/
   - вход — http://localhost/login/
   - админка — http://localhost/admin/

## Устранённые уязвимости

| Уязвимость | Что сделано | Основные файлы |
|---|---|---|
| **Path Traversal** | Нормализация пути и проверка, что файл лежит внутри `public`; отдаём только обычные файлы. Имя загружаемого файла генерируется (`randomUUID`), расширение — из белого списка mime-типов | `middlewares/serverStatic.ts`, `middlewares/file.ts` |
| **NoSQL-инъекция** | Убран `Object.assign(filters, status)`; статус — только строка из белого списка. Подключена Joi-валидация на `/auth/login` и `/auth/register` | `controllers/order.ts`, `routes/auth.ts` |
| **ReDoS** | Пользовательский `search` экранируется (`escapeRegExp`), приводится к строке и ограничивается по длине; регулярка телефона заменена на линейную | `controllers/order.ts`, `controllers/customers.ts`, `middlewares/validations.ts` |
| **Переполнение / DoS телом** | Лимит тела запроса (`json`/`urlencoded` 10kb); лимит размера и количества файлов у multer; отклонение пустых файлов; ограничение пагинации | `app.ts`, `middlewares/file.ts`, `controllers/upload.ts`, `controllers/products.ts` |
| **DDoS** | `express-rate-limit` (100 запросов/мин на IP), `helmet` (защитные заголовки, удаление `X-Powered-By`); чистка error-handler (нет флуда логов и утечки деталей) | `app.ts`, `middlewares/error-handler.ts` |
| **XSS** | Санитизация `comment`/`deliveryAddress` (`sanitize-html`) при создании заказа; убран `dangerouslySetInnerHTML` во фронтенде; SVG исключён из загрузок | `controllers/order.ts`, `utils/sanitizeHtml.ts`, `frontend/.../*-order-detail.tsx` |
| **CSRF** | Double-submit токен (`GET /auth/csrf-token`), проверка на `/auth/login` и `/auth/register`; фронт шлёт `X-CSRF-Token`; refresh-кука `sameSite=strict` | `middlewares/csrf.ts`, `routes/auth.ts`, `frontend/utils/weblarek-api.ts` |
| **Контроль доступа** | Guard `Admin` на `/customers/*` и `/order/all`; whitelist полей в обновлении пользователя (нельзя выдать себе `roles`) | `routes/customers.ts`, `routes/order.ts`, `controllers/auth.ts`, `controllers/customers.ts` |
| **Криптография / конфиг** | Пароли на `bcrypt` вместо `md5`; убраны предсказуемые секреты; CORS ограничен `ORIGIN_ALLOW` с `credentials` | `models/user.ts`, `config.ts`, `app.ts` |
| **Стабильность** | `throw` из async-middleware заменён на `next()` — запрос без токена больше не роняет процесс | `middlewares/auth.ts` |

## Аудит зависимостей и качество кода

- `npm audit` — **0 уязвимостей**. Prototype pollution в `lodash` (транзитивно
  через `celebrate`) закрыт `overrides` на `lodash@4.18.1` без ломающего
  даунгрейда `celebrate`.
- `npx eslint src/**/*.ts` — без ошибок и предупреждений.
- `tsc` — сборка без ошибок типизации.
