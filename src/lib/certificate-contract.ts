import { Keypair, contract } from "@stellar/stellar-sdk";
import { Client, networks } from "certificate-contract-bindings";

// Server-only: talks to the certificate contract using the platform's admin
// key. Never import this from a client component — CERTIFICATE_ADMIN_SECRET
// must not reach the browser bundle.

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? networks.testnet.networkPassphrase;
const CONTRACT_ID = process.env.CERTIFICATE_CONTRACT_ID ?? networks.testnet.contractId;
const ADMIN_SECRET = process.env.CERTIFICATE_ADMIN_SECRET ?? "";

export class ContractAlreadyMintedError extends Error {}

let client: Client | null = null;

function getClient(): Client {
  if (!ADMIN_SECRET) throw new Error("CERTIFICATE_ADMIN_SECRET is not configured");

  if (!client) {
    const admin = Keypair.fromSecret(ADMIN_SECRET);
    const signer = contract.basicNodeSigner(admin, NETWORK_PASSPHRASE);
    client = new Client({
      contractId: CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
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
// AlreadyMinted is Error variant #3 in the contract (see contract/certificate/src/lib.rs).
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
