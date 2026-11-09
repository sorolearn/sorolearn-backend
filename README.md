# sorolearn-backend

The API behind [SoroLearn](https://github.com/sorolearn/sorolearn-frontend). It holds the platform's admin key and uses it to mint and check on-chain course-completion certificates. The frontend calls this service so that the key never reaches the browser.

Related repos:

- [sorolearn-frontend](https://github.com/sorolearn/sorolearn-frontend): the Next.js learning app that calls this API
- [sorolearn-contract](https://github.com/sorolearn/sorolearn-contract): the Soroban certificate contract this API talks to

## API

| Method | Path | Body / query | Success response |
| --- | --- | --- | --- |
| `GET` | `/health` | none | `{ "ok": true }` |
| `POST` | `/api/certificate/mint` | `{ "learner": "G…", "course": "beginner" }` | `{ "txHash": "…" }` |
| `GET` | `/api/certificate/status` | `?learner=G…&course=beginner` | `{ "hasCertificate": true }` |

Errors come back as `{ "error": "…" }`:

- `400`: invalid learner address or unknown course
- `409`: a certificate is already minted for that learner and course
- `500`: the contract call failed (details are logged, not returned)

Valid course slugs live in [`src/courses.ts`](src/courses.ts) and must match the frontend's course registry.

> **Known gap:** `/api/certificate/mint` does not check that the learner actually completed the course, because progress is only stored in the learner's browser. Anyone can mint a certificate for any address, and the admin account pays the fee each time. Fixing this needs server-side progress or grading.

## Getting started

Requires Node.js 20.12+.

```bash
npm install
cp .env.example .env    # then set CERTIFICATE_ADMIN_SECRET
npm run dev             # http://localhost:4000, restarts on changes
```

`.env.example` documents every variable. Only `CERTIFICATE_ADMIN_SECRET` is required; the rest default to the testnet deployment. Set `ALLOWED_ORIGINS` to the frontend's URL(s), comma-separated, so browsers are allowed to call the API.

## Test and build

```bash
npm run typecheck
npm test                # or npm run test:coverage
npm run build           # compiles to dist/
npm start               # runs dist/index.js
```

Route tests mock the contract layer ([`src/app.test.ts`](src/app.test.ts)), so they need no network access or secrets.

## Deploying

This is a plain Node HTTP server (Hono on `@hono/node-server`). It runs on any Node host: Render, Railway, Fly.io, a VPS, or a container. Run `npm ci && npm run build`, start it with `npm start`, and set the env vars from `.env.example` on the host. The host normally provides `PORT`.

## Updating the contract client

[`src/certificate-client.ts`](src/certificate-client.ts) is generated from the deployed contract. If the contract's public interface changes in sorolearn-contract, regenerate it:

```bash
stellar contract bindings typescript \
  --contract-id <CONTRACT_ID> --network testnet --output-dir /tmp/bindings
```

Then copy the generated client into `src/certificate-client.ts`, keeping the header comment.
