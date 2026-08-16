# Call Booking

A simplified Cal.com-style time-booking service. The calendar owner publishes
event types (each with a duration in minutes); a guest picks an event type,
chooses a free 30-minute-grid slot within the next 14 days, and books a call. Two
bookings can never occupy overlapping time, even across different event types.

Built with the **Design First** approach — the API contract in
[`spec/main.tsp`](spec/main.tsp) (TypeSpec) is the single source of truth. The
OpenAPI specification [`api-contract.yaml`](api-contract.yaml) is generated from
it with `npm run generate` in `spec/`.

- **Contract:** TypeSpec (`spec/`) → OpenAPI (`api-contract.yaml`)
- **Backend:** Node.js 20 / Express / better-sqlite3 (`server/`)
- **Frontend:** TypeScript + React + Vite, shadcn/ui, Tailwind CSS (`client/`)

## Contract

```bash
cd spec && npm install && npm run generate   # emits api-contract.yaml
```

## Running locally

```bash
# Backend (API + serves the built client)
cd server && npm install && npm start        # http://localhost:3000

# Frontend dev server (hot reload, proxies /api to :3000)
cd client && npm install && npm run dev      # http://localhost:5173
```

## Frontend

The UI is a separate TypeScript + Vite + [shadcn/ui](https://ui.shadcn.com) app in
`client/`. It talks to the API only through the contract endpoints in
`api-contract.yaml` (typed client in `client/src/api.ts`).

```bash
cd client
npm install

npm run dev        # dev server, proxies /api to the real backend (http://localhost:5173)
npm run typecheck  # tsc --noEmit
npm run build      # production build to client/dist
```

### Working against a Prism mock

During frontend development the API can be emulated from the contract instead of
running the backend:

```bash
cd client
npm run mock                       # Prism on http://localhost:4010
VITE_API_BASE=http://localhost:4010 npm run dev
```

Prism serves the contract responses from `api-contract.yaml` (route prefix is
skipped for its relative `/api` server URL), so the UI can be developed and
tested contract-first without a live backend.

## Tests

```bash
# Backend API tests (Node test runner)
cd server && npm test

# End-to-end user scenarios (Playwright, real browser)
cd e2e && npm install && npx playwright install chromium && npm run test
```

The E2E suite starts the real backend (fresh in-memory DB) and the real
frontend, then drives the browser through the main booking scenarios — see
[`docs/user-scenarios.md`](docs/user-scenarios.md).

## CI & Releases

- **CI** (`.github/workflows/ci.yml`): runs the API tests, typechecks and builds
  the client, and runs the Playwright scenarios on every push/PR.
- **Conventional Commits**: all commits (including agent-generated ones) follow
  the [`feat:`, `fix:`, etc.`](https://www.conventionalcommits.org) format. Agent
  commits keep the `[AI-Generated]` marker in the subject, e.g.
  `feat: [AI-Generated] add slot booking`.
- **release-please** (`.github/workflows/release-please.yml`): on every merge to
  `main` it opens/updates a release PR with a generated `CHANGELOG.md` and a
  semver bump based on the commit types. Merging that PR publishes a tagged
  release.

## Docker

```bash
docker build -t call-booking .
docker run -p 3000:3000 -e PORT=3000 call-booking
```

The server reads `PORT` from the environment and binds to `0.0.0.0`.

## API

| Method & Path | Purpose |
| :--- | :--- |
| `GET /api/owner` | Default calendar owner profile (admin part) |
| `GET /api/event-types` | Published event types (name, description, duration) |
| `POST /api/event-types` | Owner creates an event type |
| `GET /api/slots?eventTypeId=&date=` | 30-minute-grid slots for a type, 14-day window, booked ones flagged |
| `POST /api/bookings` | Book `{eventTypeId, slotId, name, email?}`; `409` on overlap |
| `GET /api/bookings` | Upcoming meetings across all types, oldest first |

### Hexlet tests and linter status:
[![Actions Status](https://github.com/serdarsabreder/frontend-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/serdarsabreder/frontend-project-386/actions)
