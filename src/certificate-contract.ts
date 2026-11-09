import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client, networks } from "./certificate-client.js";

// Talks to the certificate contract using the platform's admin key. This is
// the reason the backend exists: CERTIFICATE_ADMIN_SECRET must never reach
// the frontend.

export class ContractAlreadyMintedError extends Error {}

let client: Client | null = null;

// Env is read lazily (on first use, not at import time) so that index.ts can
// load .env before anything here looks at process.env.
function getClient(): Client {
  const adminSecret = process.env.CERTIFICATE_ADMIN_SECRET ?? "";
  if (!adminSecret) throw new Error("CERTIFICATE_ADMIN_SECRET is not configured");

  if (!client) {
    const networkPassphrase =
      process.env.STELLAR_NETWORK_PASSPHRASE ?? networks.testnet.networkPassphrase;
    const admin = Keypair.fromSecret(adminSecret);
    const signer = basicNodeSigner(admin, networkPassphrase);
    client = new Client({
      contractId: process.env.CERTIFICATE_CONTRACT_ID ?? networks.testnet.contractId,
      networkPassphrase,
      rpcUrl: process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
      publicKey: admin.publicKey(),
      signTransaction: signer.signTransaction,
      signAuthEntry: signer.signAuthEntry,
    });
  }
  return client;
}

/**
 * Mints a completion certificate for `learner`/`course`, signed by the
 * platform admin. Returns the submitted transaction hash.
 */
// AlreadyMinted is Error variant #3 in the contract (see src/lib.rs in the sorolearn-contract repo).
// A contract error during simulation surfaces as a thrown Error containing
// "Error(Contract, #3)" rather than through AssembledTransaction's Result
// wrapper — that wrapper only applies to errors returned after submission.
const ALREADY_MINTED_PATTERN = /Error\(Contract, #3\)|AlreadyMinted/;

export async function mintCertificateOnChain(learner: string, course: string): Promise<string> {
  try {
    const tx = await getClient().mint_certificate({ learner, course });
    const sent = await tx.signAndSend();

    if (sent.result.isErr()) {
      const { message } = sent.result.unwrapErr();
      if (message === "AlreadyMinted") {
        throw new ContractAlreadyMintedError(`Certificate already minted for ${learner}/${course}`);
      }
      throw new Error(message);
    }

    return sent.getTransactionResponse?.txHash ?? sent.sendTransactionResponse?.hash ?? "";
  } catch (err) {
    if (err instanceof Error && ALREADY_MINTED_PATTERN.test(err.message)) {
      throw new ContractAlreadyMintedError(`Certificate already minted for ${learner}/${course}`);
    }
    throw err;
  }
}

export async function hasCertificateOnChain(learner: string, course: string): Promise<boolean> {
  const { result } = await getClient().has_certificate({ learner, course });
  return result;
}
