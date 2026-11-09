import { Hono } from "hono";
import { cors } from "hono/cors";
import { StrKey } from "@stellar/stellar-sdk";
import { isKnownCourse } from "./courses.js";
import {
  ContractAlreadyMintedError,
  hasCertificateOnChain,
  mintCertificateOnChain,
} from "./certificate-contract.js";

export interface AppOptions {
  /** Origins allowed to call the API from a browser (the frontend's URL). */
  allowedOrigins: string[];
}

function isValidLearner(learner: unknown): learner is string {
  return typeof learner === "string" && StrKey.isValidEd25519PublicKey(learner);
}

export function createApp({ allowedOrigins }: AppOptions) {
  const app = new Hono();

  app.use("/api/*", cors({ origin: allowedOrigins, allowMethods: ["GET", "POST"] }));

  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/api/certificate/mint", async (c) => {
    const body = await c.req.json().catch(() => null);
    const learner = body?.learner;
    const course = body?.course;

    if (!isValidLearner(learner)) {
      return c.json({ error: "Invalid learner address" }, 400);
    }
    if (!isKnownCourse(course)) {
      return c.json({ error: "Invalid course" }, 400);
    }

    try {
      const txHash = await mintCertificateOnChain(learner, course);
      return c.json({ txHash });
    } catch (err) {
      if (err instanceof ContractAlreadyMintedError) {
        return c.json({ error: err.message }, 409);
      }
      console.error("mint_certificate failed", err);
      return c.json({ error: "Mint failed" }, 500);
    }
  });

  app.get("/api/certificate/status", async (c) => {
    const learner = c.req.query("learner");
    const course = c.req.query("course");

    if (!isValidLearner(learner)) {
      return c.json({ error: "Invalid learner address" }, 400);
    }
    if (!isKnownCourse(course)) {
      return c.json({ error: "Invalid course" }, 400);
    }

    try {
      const hasCertificate = await hasCertificateOnChain(learner, course);
      return c.json({ hasCertificate });
    } catch (err) {
      console.error("has_certificate failed", err);
      return c.json({ error: "Status check failed" }, 500);
    }
  });

  return app;
}
