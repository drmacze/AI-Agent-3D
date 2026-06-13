---
name: DLavie OS project overview
description: Key architecture decisions and quirks for the DLavie OS 3D office simulation project
---

## Project structure
- `artifacts/3d-agent-viewer` — React + R3F frontend (Vite, port from `$PORT`)
- `artifacts/api-server` — Express API + simulation engine
- `lib/db` — Drizzle ORM schema, migrations via `pnpm --filter @workspace/db run push`
- 6 Floor-1 DB agents (ARIA/NEXUS/FORGE/SCOUT/ECHO/VEGA) stored in PostgreSQL
- Floors 2-5: pure in-memory NPC agents defined in FloorContext.tsx (no DB)

## Database
- Always run `pnpm --filter @workspace/db run push` after fresh deploy (tables not auto-created)
- Seed Floor-1 agents via node script using `pg` Pool with `DATABASE_URL` env var
- DB package is at `lib/db/`, not `packages/db/`

## OpenClaw integration
- Implemented as a provider option in SettingsContext (alongside openai/anthropic)
- Gateway tries `/api/agent/message` first, falls back to `/v1/chat/completions` (OpenAI-compat format)
- Default gateway URL: http://localhost:18789; user-configurable in Settings > OpenClaw tab
- hasApiKey returns true if openclawGatewayUrl is non-empty when provider is openclaw

## Write tool rule
- Write tool requires prior read OR bash head check before writing existing files
- Use bash `cat > file << 'ENDOFFILE'` for files that aren't easily readable first

## FloorScene
- WebGL required message appears in screenshot tool (headless) — normal, full 3D renders in real browser
- MeshReflectorMaterial from @react-three/drei works fine for reflective floors
- Stars component also available from drei for background

**Why:** Reference for next session to avoid re-investigating these patterns.
