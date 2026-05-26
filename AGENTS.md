# LP-Ops — Agent Guide

## Quick start

```bash
# Backend (port 8000)
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (port 5173, needs backend running)
cd frontend && pnpm install && pnpm run dev
```

## Commands

| Area | Command | Notes |
|------|---------|-------|
| Frontend dev | `pnpm run dev` | Vite dev server on :5173 |
| Frontend build | `pnpm run build` | Runs `tsc -b` THEN `vite build` (typecheck before build) |
| Frontend lint | `pnpm run lint` | ESLint on all `*.ts,*.tsx` |
| Backend | `uvicorn backend.main:app --reload --port 8000` | Swagger at `/docs` |

Package manager is **pnpm** (lockfile: `pnpm-lock.yaml`), not npm.

## Architecture

- **`backend/`** — Python 3.12+, FastAPI, PuLP (CBC solver)
- **`frontend/`** — React 19, TypeScript 6, Vite 8
- **Monorepo root** — only shared Python deps in `requirements.txt`

### Backend layout

| Path | Role |
|------|------|
| `backend/main.py` | FastAPI entrypoint, CORS (localhost:5173 only) |
| `backend/routers/solve.py` | Main API: `POST /api/solve`, `GET /api/solve/{id}/ai`, `GET /api/models` |
| `backend/routers/solver.py` | Legacy endpoint (`POST /api/solver/solve`) |
| `backend/solvers/registry.py` | Solver registry — `get_solver(type)`, `list_model_types()` |
| `backend/solvers/base.py` | `BaseSolver` ABC — implement `solve(req) -> UnifiedSolveResponse` and `validate(payload)` |
| `backend/services/ai/` | AI Insights — runs `opencode run --format json` as subprocess (30s timeout), falls back to deterministic `_fallback_analysis()` |

### Solver types (modelType)

`classical` — `assignment` — `transport`

All use `UnifiedSolveRequest` / `UnifiedSolveResponse` from `backend/schemas/unified.py`.

### AI Insights flow

1. `POST /api/solve` stores result with `solve_id`, kicks off `asyncio.create_task(_run_ai_analysis(...))`
2. AI runs in a thread: spawns `opencode run --format json --dangerously-skip-permissions`, reads NDJSON text event
3. If opencode CLI not found / fails / times out → deterministic fallback
4. Frontend polls `GET /api/solve/{id}/ai` every 2s
5. Results stored in-memory dict with 5min TTL

## Conventions

- UI language is **Spanish** (error messages, interpretations, labels)
- Backend imports use `backend.*` package path (not `src.*`)
- CSS modules, glassmorphism design
- No tests, no CI, no Docker, no pre-commit hooks, no type annotations config beyond strict `tsconfig`
- `VITE_API_URL` env var for API base URL (default `http://localhost:8000`)
- `.venv/` at root for Python venv (gitignored)

## AI analysis config (`.agents/`)

- `frontend-design` skill is installed; loaded automatically when building UI components.
