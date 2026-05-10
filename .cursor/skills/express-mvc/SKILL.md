---
name: express-mvc
description: Keeps the Express API in a layered MVC-style layout (routes, controllers, services, data access, middleware). Use when adding or changing code under api/, writing Express handlers, or when the user mentions API structure, controllers, or separating business logic from HTTP.
disable-model-invocation: true
---

# Express MVC structure

## Target layout (`api/src/`)

```
api/src/
├── index.ts              # create app, register middleware, mount routes, listen
├── routes/               # wire HTTP paths to controllers; no business logic
├── controllers/          # HTTP layer: parse input, call services, set status/body
├── services/             # business rules, orchestration; no Express types here
├── middleware/           # auth, logging, error boundary, request scope
├── validators/           # zod schemas / parse helpers shared by routes
└── repositories/         # Prisma/DB queries (optional alias for “models” data layer)
```

Use **`repositories/`** (or `models/` only for static factories) for database access. Prefer **`services/`** naming over fat “models” that mix ORM and domain logic.

## Rules

1. **Routes** export routers (`Router()`); they register paths and delegate to **controllers** only.
2. **Controllers** are thin: validate (or use middleware), call **one service** method per action, map results and errors to HTTP. No raw Prisma in controllers.
3. **Services** contain domain logic, transactions, and call **repositories**. They do not import `Request`/`Response`.
4. **Repositories** encapsulate Prisma queries and return typed domain shapes or DTOs.
5. **Validators**: reuse Zod schemas from `validators/` in routes or middleware; avoid inline duplicate schemas in multiple files.
6. **Errors**: map domain failures to HTTP in the controller or a centralized error middleware (consistent `{ error, code }` JSON).

## Adding a new endpoint

1. Add Zod schema in `validators/` if needed.
2. Add repository methods if new persistence is required.
3. Implement service method.
4. Add controller function.
5. Register route in `routes/` and mount in `index.ts`.

## Anti-patterns

- Business logic or Prisma calls inside `routes/*.ts` or inline in `index.ts`.
- Controllers importing Prisma directly.
- Circular imports between service ↔ repository (extract shared types to `packages/shared` or `api/src/types/` when needed).
