---
name: nextjs-app-structure
description: Keeps the Next.js App Router codebase organized (routes, UI, server-only code, data fetching). Use when adding pages, components, server actions, or changing code under web/, or when the user mentions Next.js layout, app router, or frontend structure.
disable-model-invocation: true
---

# Next.js App Router structure

## Target layout (`web/`)

```
web/
├── app/                          # routes, layouts, loading/error, route handlers
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (marketing)/              # optional route groups
│   └── api/                      # Route Handlers only when needed (prefer calling api/ service)
├── components/
│   ├── ui/                       # generic primitives (buttons, inputs)
│   └── features/               # domain-specific (or group by feature folder)
├── lib/                          # shared helpers, clients, env validation
│   └── server/                   # server-only (db, secrets) — import only from Server Components / actions
└── public/
```

## Rules

1. **`app/`** owns routing and RSC boundaries. Keep route segments focused; lift repeated UI to `components/`.
2. **Server vs client**: add `"use client"` only on leaf components that need hooks/events. Default to Server Components.
3. **`lib/server/`**: code that must never ship to the browser (ORM, tokens). Do not import `lib/server/*` from client components.
4. **Data fetching**: prefer server-side fetch in RSC or server actions calling the orchestration API or shared packages — avoid exposing secrets in the browser.
5. **Styles**: colocate small styles with components; global tokens in `app/globals.css` / Tailwind theme.
6. **Types**: shared DTOs live in `packages/shared`; web imports types from there instead of duplicating.

## Anti-patterns

- Large business workflows inside `page.tsx` — move to `lib/` or feature modules under `components/features/`.
- Duplicating API URL construction — centralize in `lib/api.ts` (or similar).
- Putting Prisma or raw secrets anywhere outside `lib/server/` (or edge-safe equivalents).
