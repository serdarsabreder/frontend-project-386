# AGENTS.md

## Project: Call Booking

This document details the involvement of the AI agent (OpenCode) in the development of the Call Booking project. It serves as proof that the codebase adheres to the core criterion: *"ideally, all project code is written with the help of an agent."*

**Stack:** Node.js 20 / Express (backend) · React + Vite (frontend) · better-sqlite3 (persistence)

---

## 1. Agent’s Role and Methodology

The development followed a **Design First** approach: the AI agent fixed the API contract before any implementation, then built the frontend and backend independently against that contract.

**Methodology:**
*   **Contract-First Design:** The agent generated the API contract in TypeSpec (`spec/main.tsp`) — endpoints, payloads, status codes, error envelopes — before writing any controller or component. The OpenAPI file (`api-contract.yaml`) is emitted with `tsp compile`, so it can never drift from the source of truth.
*   **Iterative Refinement:** Code was produced in small, testable chunks and immediately validated: the agent's first slot generator produced 9 slots instead of 18 (it emitted one 30-min slot per hour), which the tests caught; the generator now emits two slots per hour.
*   **Infrastructure-as-Code:** The agent created a multi-stage `Dockerfile` and runtime configuration (dynamic `PORT`) so the app runs identically on a host and in a container.

---

## 2. Implementation Breakdown by Requirement

### ✅ What Must Work: User Scenarios

| Scenario | Agent’s Contribution | Verification Evidence |
| :--- | :--- | :--- |
| **Slot Booking Flow** | Generated the full flow: choosing an event type (`TypesPage`) → fetching its 14-day slot window (`GET /api/slots?eventTypeId=`) → UI selection (Cal.com-style `BookingPage` with a week grid and day/time rows) → API request (`POST /api/bookings`) → handling success → updating UI state. Includes persistence to SQLite. | Automated integration tests (`server/test/api.test.js`) confirm a booking is saved and appears in `GET /api/bookings`. |
| **Slot Availability (Conflict)** | Implemented the concurrency-safe check to prevent double-booking: a `UNIQUE(start_time)` constraint plus a database transaction. A double-booking attempt maps to HTTP 409 with the exact JSON error `{"error": "This time slot is already reserved."}`. | Tests book the same slot twice and assert the second response is `409` with the contract error message. |

### ✅ Design Requirements

| Requirement | Agent’s Contribution | Verification Evidence |
| :--- | :--- | :--- |
| **Design First (API Contract)** | Authored the contract in TypeSpec (`spec/main.tsp`) defining `GET /api/owner`, `GET /api/event-types`, `POST /api/event-types`, `GET /api/slots`, `POST /api/bookings`, `GET /api/bookings`, all request/response schemas and error structures. | `spec/main.tsp` compiles to `api-contract.yaml` in the repo root. |
| **Dockerfile** | Generated a three-stage `Dockerfile`: client build → server deps → minimal runtime with only the compiled client and server code. | `Dockerfile` exists in the root directory; GitHub Actions (`hexlet-check`) builds the image and starts the container. |
| **Container Execution** | The runtime stage contains no host dependencies: Node + `node_modules` + server source + built client. | `hexlet-check` workflow builds and launches the container in CI. |
| **Port Configuration** | The server reads `PORT` from `process.env` and binds to `0.0.0.0` (`server/src/index.js`). No hardcoded ports. | `index.js` uses `Number(process.env.PORT) || 3000` and `HOST || '0.0.0.0'`. |

---

## 3. API Contract Summary

All endpoints are mounted under `/api` and return JSON. The contract is authored
in TypeSpec (`spec/main.tsp`, the single source of truth) and compiled to
`api-contract.yaml`.

| Method & Path | Purpose | Success | Errors |
| :--- | :--- | :--- | :--- |
| `GET /api/owner` | Default calendar owner profile (admin part) | `200` `Owner` | — |
| `GET /api/event-types` | Published event types (id, name, description, duration) | `200` `EventType[]` | — |
| `POST /api/event-types` | Owner creates an event type | `201` `EventType` | `400` invalid |
| `GET /api/slots?eventTypeId=&date=` | 30-minute-grid slots for a type, 14-day booking window, booked ones flagged | `200` `SlotsResponse` | `400` bad params, `404` unknown type |
| `POST /api/bookings` | Book `{eventTypeId, slotId, name, email?}` | `201` `Booking` | `400` invalid, `404` unknown type/slot, `409` overlap (across event types) |
| `GET /api/bookings` | Upcoming meetings across all types, oldest first | `200` `Booking[]` | — |

Occupancy is global: two bookings may never overlap in time, even when they are
for different event types. See `api-contract.yaml` for the full specification.

---

## 4. Specific Prompts and Generated Artifacts

Examples of prompts that produced critical parts of the project:

*   **Prompt for the API contract:**
    > "Design First: write a TypeSpec contract for a Cal.com-style booking service. Define `GET /api/owner`, `GET /api/event-types`, `POST /api/event-types`, `GET /api/slots?eventTypeId&date`, `POST /api/bookings`, `GET /api/bookings`. Slots are 30-minute grid within 09:00–18:00 for the next 14 days; each event type has a duration in minutes; booking an overlapping slot must return 409."
    *   *Result:* `spec/main.tsp` — the single source of truth, compiled to `api-contract.yaml` via `tsp compile`.

*   **Prompt for conflict logic:**
    > "Write an Express handler for `POST /api/bookings`. Accept `{ slotId, name, email? }`. Before saving, guard against double-booking with a database transaction and a UNIQUE constraint on the slot start time. If taken, return HTTP 409 with JSON `{ error: 'This time slot is already reserved.' }`. Read `PORT` from `process.env` and bind to `0.0.0.0`."
    *   *Result:* `server/src/routes/bookings.js` — transactional insert whose `SQLITE_CONSTRAINT_UNIQUE` is mapped to `409`.

*   **Prompt for the Dockerfile:**
    > "Create a multi-stage `Dockerfile` for a Node.js app with a separately built Vite/React client. Stage 1 builds the client, stage 2 installs production server deps, stage 3 copies only runtime artifacts. Use `node:20-bookworm-slim` so better-sqlite3 prebuilds work. The app must start on `PORT`."
    *   *Result:* Root `Dockerfile` with three stages and correct `CMD`.

*   **Prompt for frontend-backend interaction:**
    > "Generate a React component for the booking modal. It calls `POST /api/bookings`. Handle the 409 specifically to show a friendly toast, then refresh the availability so the taken slot turns grey."
    *   *Result:* `client/src/components/BookingModal.jsx` — handles `err.status === 409` with a friendly message and reloads slots.

*   **Prompt for the Cal.com-style redesign:**
    > "Recreate the booking page from the Cal.com reference: a centered card with an event header (owner name + event-type badge, duration/timezone meta), a 14-day week grid with a highlighted today, a day column with the big date number, and a list of time slots that grey out when taken. Port the exact classes and Inter font."
    *   *Result:* `client/src/components/BookingPage.jsx` + `client/src/styles.css` — the reference layout (event-header, week-grid, day-time-row, cal-footer) wired to the new `GET /api/slots?eventTypeId=` API, plus a `TypesPage` for event-type selection and an owner dashboard.

---

## 5. Commit Strategy & Traceability

To make the "agent-written" criterion verifiable during the GitHub Actions check:

1.  **Commit Messages:** Every commit includes the prefix `[AI-Generated]` or `[AI-Refactored]` to indicate the origin of the code.
2.  **Code Comments:** Complex algorithms carry comments attributing their generation to the agent (e.g. `// Logic generated by AI Agent: ...` in `slots.js`, `bookings.js`, `db.js`).
3.  **Artifacts:** This `AGENTS.md`, the `api-contract.yaml`, and the integration tests prove the Design First approach.

---

## 6. Automated Checks (GitHub Actions)

| Check Item | Status | Notes |
| :--- | :--- | :--- |
| **Build & Launch** | ✅ Configured | `hexlet-check` builds the image and starts the container in CI. |
| **Port Variable** | ✅ Verified | Server reads `process.env.PORT` and binds to `0.0.0.0`. |
| **Functional Tests** | ✅ Pass (local) | `server/test/api.test.js` — 12 tests covering owner/event-type listing, event-type creation, the 14-day slot window, slot-date filtering and params, booking creation, 409 duplicate + cross-type overlap, 400 validation, 404 unknown type/slot, and upcoming-meetings listing. |

---

## 7. Future Development Roadmap (Agent-Assisted)

*   **Custom Scheduling:** flexible windows, breaks, holidays, exceptions.
*   **Time Zones:** timezone-aware slot generation and conversion for global users.
*   **Registration & Accounts:** authentication and multi-tenant data isolation.
*   **Integrations:** adapters for Google Calendar, Outlook.
*   **Notifications:** email, Telegram, push triggers.
*   **Advanced Scenarios:** rescheduling, cancellations, recurring events, analytics.
