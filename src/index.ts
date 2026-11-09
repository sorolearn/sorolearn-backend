import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

// Load .env for local development. In production the host sets real env vars
// and there's no .env file, which is fine.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

serve({ fetch: createApp({ allowedOrigins }).fetch, port }, (info) => {
  console.log(`sorolearn-backend listening on http://localhost:${info.port}`);
});
