import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";

vi.mock("./certificate-contract.js", () => {
  class ContractAlreadyMintedError extends Error {}
  return {
    ContractAlreadyMintedError,
    mintCertificateOnChain: vi.fn(),
    hasCertificateOnChain: vi.fn(),
  };
});

import { createApp } from "./app.js";
import {
  ContractAlreadyMintedError,
  hasCertificateOnChain,
  mintCertificateOnChain,
} from "./certificate-contract.js";

const FRONTEND = "http://localhost:3000";
const app = createApp({ allowedOrigins: [FRONTEND] });
const learner = Keypair.random().publicKey();

function mint(body: unknown) {
  return app.request("/api/certificate/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function status(params: Record<string, string>) {
  return app.request(`/api/certificate/status?${new URLSearchParams(params)}`);
}

beforeEach(() => {
  vi.mocked(mintCertificateOnChain).mockReset();
  vi.mocked(hasCertificateOnChain).mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /health", () => {
  it("responds ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /api/certificate/mint", () => {
  it("mints and returns the transaction hash", async () => {
    vi.mocked(mintCertificateOnChain).mockResolvedValue("abc123");

    const res = await mint({ learner, course: "beginner" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ txHash: "abc123" });
    expect(mintCertificateOnChain).toHaveBeenCalledWith(learner, "beginner");
  });

  it("rejects an invalid learner address", async () => {
    const res = await mint({ learner: "not-an-address", course: "beginner" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid learner address" });
    expect(mintCertificateOnChain).not.toHaveBeenCalled();
  });

  it("rejects an unknown course", async () => {
    const res = await mint({ learner, course: "underwater-basket-weaving" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid course" });
    expect(mintCertificateOnChain).not.toHaveBeenCalled();
  });

  it("rejects a body that isn't JSON", async () => {
    const res = await mint("{not json");
    expect(res.status).toBe(400);
  });

  it("returns 409 when the certificate was already minted", async () => {
    vi.mocked(mintCertificateOnChain).mockRejectedValue(
      new ContractAlreadyMintedError("Certificate already minted")
    );

    const res = await mint({ learner, course: "beginner" });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Certificate already minted" });
  });

  it("returns 500 without leaking the underlying error", async () => {
    vi.mocked(mintCertificateOnChain).mockRejectedValue(new Error("RPC exploded: secret detail"));

    const res = await mint({ learner, course: "beginner" });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Mint failed" });
  });
});

describe("GET /api/certificate/status", () => {
  it("reports whether the learner holds a certificate", async () => {
    vi.mocked(hasCertificateOnChain).mockResolvedValue(true);

    const res = await status({ learner, course: "intermediate" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hasCertificate: true });
    expect(hasCertificateOnChain).toHaveBeenCalledWith(learner, "intermediate");
  });

  it("rejects a missing learner", async () => {
    const res = await status({ course: "beginner" });
    expect(res.status).toBe(400);
    expect(hasCertificateOnChain).not.toHaveBeenCalled();
  });

  it("rejects an unknown course", async () => {
    const res = await status({ learner, course: "nope" });
    expect(res.status).toBe(400);
  });

  it("returns 500 when the contract call fails", async () => {
    vi.mocked(hasCertificateOnChain).mockRejectedValue(new Error("boom"));

    const res = await status({ learner, course: "beginner" });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Status check failed" });
  });
});

describe("CORS", () => {
  it("allows the configured frontend origin", async () => {
    const res = await app.request("/api/certificate/status", {
      method: "OPTIONS",
      headers: { Origin: FRONTEND, "Access-Control-Request-Method": "GET" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND);
  });

  it("does not allow other origins", async () => {
    const res = await app.request("/api/certificate/status", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "GET" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
