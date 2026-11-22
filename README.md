# little

**Little Explorer World** — _A little step. A big discovery._

A premium 3D playful learning platform for children aged 5–6 in Vietnam (iPad & desktop), with parent and admin experiences. Product and technical docs live in [`docs/`](docs/).

> Status: **Sprint 01 — Foundation & Design System.** No learning content, accounts or database yet. See [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md).

## Requirements

- Node.js 22+
- pnpm 10 (`corepack enable`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional for now; no secrets needed in Sprint 01
pnpm dev
```

- App: http://localhost:3000
- Design system gallery: http://localhost:3000/dev/design-system (dev only; set `ENABLE_DESIGN_SYSTEM=true` **at build time** to include it in a production build)

## Scripts

| Command                        | What it does                                   |
| ------------------------------ | ---------------------------------------------- |
| `pnpm dev`                     | Dev server                                     |
| `pnpm build` / `pnpm start`    | Production build / serve                       |
| `pnpm typecheck`               | Generate Next route types, then `tsc` (strict) |
| `pnpm lint`                    | ESLint (Next core-web-vitals + TypeScript)     |
| `pnpm test`                    | Vitest unit tests (jsdom)                      |
| `pnpm format` / `format:check` | Prettier (+ Tailwind class sorting)            |
| `pnpm check`                   | typecheck + lint + test + format check         |

## Structure

```
src/
  app/                    routes (App Router); /dev/design-system is the component gallery
  components/
    ui/                   Button3D, IconButton3D, Card, SpeechBubble, icons, tones
    kid/                  Mascot, BigChoice, AudioPromptButton, ProgressPath, StarBurst, ParentGate
    layout/               KidShell, ParentShell, AdminShell, Logo
  lib/
    audio/                audio engine (unlock, preload, playback, TTS fallback, SFX) + React hook
    parent-gate/          adult-check challenge logic
    env.ts, env.server.ts Zod-validated environment
  styles/tokens.css       design tokens (Tailwind v4 theme)
legacy/prototype.html     original "Bé Vui Học Tập" prototype, kept as reference
docs/                     PRD, architecture, UX/UI, database plan, roadmap, decisions
```

## Legacy prototype

`legacy/prototype.html` is the original single-file prototype. Open it directly in a browser. Note: its optional Firebase sync is unauthenticated (see risk R1 in `docs/ARCHITECTURE.md`).
