# Behind the Mystery

A lateral-thinking mystery game with an AI host, a detective notebook, and persistent investigations. The original prototype remains in `turtle-soup.html`; the application is in `app/`.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
# Fill in the gateway URL, model identifier, and API key in .env.local.
npm run dev
```

Open http://127.0.0.1:3000. Sessions live in `data/mystery.sqlite`. An anonymous browser cookie grants access to that visitor's sessions; clearing it loses access. Accounts and cross-device sync are not implemented.

## Model boundary

The model is `bailian/deepseek-v4.1-flash`, accessed through a compatible chat-completions gateway.
The Bailian adapter sends `enable_thinking: false` so hidden reasoning does not consume the short verdict's output budget.

- Questions: the model chooses one of five verdicts. Software renders the answer. The notebook records the actual question and verdict, never the full hidden fact.
- Theories: the model assesses each canonical fact and cites exact text from the player's explanation. Software validates identifiers, quotations, required facts, and contradictions before closing the case.
- Hints, scores, limits, sessions, persistence, and reveals are deterministic application code.
- Secrets and solutions are imported only by server modules. API keys never belong in browser bundles or source control.
- Inference is probabilistic. Structured output and evidence validation do not guarantee semantic correctness; the live script is a small regression smoke test.

## Content

Three revised cases from the prototype are playable. Public metadata is in `lib/catalog.ts`. Private facts, hints, counterexamples, and reveal timelines are in `lib/cases.server.ts`.

Increment a case's `version` when changing its facts. Active sessions pinned to an earlier version are stopped instead of silently changing the story. Future migrations can retain multiple published versions. Cases are not advertised as original works; review adaptation attribution and text before publication.

## Verification

```sh
npm test
npm run typecheck
npm run build
# Opt-in, makes 8 paid requests using .env.local:
npm run test:live
```

Tests cover session isolation, idempotent retries, concurrent actions, failed model calls, clue disclosure, hints, scoring, and adjudication validation. GitHub Actions runs tests and the build without provider credentials.

## Deployment

SQLite requires **one long-running Node/Docker instance with a persistent volume**. Do not use ephemeral serverless filesystems or multiple replicas. Migrate `lib/db.server.ts` to Postgres for that topology.

```sh
docker compose up -d --build
```

Set `APP_ORIGIN` to the public HTTPS origin. Put an HTTPS reverse proxy in front of port 3000. The container binds to localhost on the host by default. Use a gateway HTTPS URL as well: HTTP transmits the bearer token and game content without TLS. The supplied development gateway is HTTP-only and is not hardcoded into source.

`LLM_DAILY_CALL_LIMIT` defaults to 200 attempts per UTC day globally; each browser is limited to 8 attempts/minute and each investigation to 60 model turns. Failed attempts count toward the cost ceiling. Add edge/IP limits before broad public traffic, since visitors can clear cookies. Requests have a 35-second model deadline, a bounded body, a durable per-session lock, and idempotency keys. AI output is validated before being displayed.

Back up SQLite using its backup API or stop the server first. Keep the `mystery-data` volume when updating. Single-host SQLite is suitable for an initial small release, not an availability or scale guarantee.

## Team workflow

1. Frontend: `components/`, `app/globals.css`, responsive behavior and accessibility.
2. Host/backend: `lib/host.server.ts`, `lib/game.server.ts`, `lib/db.server.ts`, API routes.
3. Content/QA: facts, hints, narrative consistency, regression questions and presentation.

Scope: solo play, three cases, free-text questions, notebook, hints, theory submission, and persistence. Multiplayer, accounts, audio, and a case editor are later work.
