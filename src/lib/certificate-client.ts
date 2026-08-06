// Typed client for the certificate contract, generated with:
//   stellar contract bindings typescript \
//     --contract-id CCVFIMTLHN2YFVKFITJYU4PWDIGNG2Q7AWWF4GPKBUBQOJEOGRDTIK5K \
//     --network testnet --output-dir <tmp>
// Inlined here (rather than kept as a separate contract/certificate/bindings
// package) because a plain `file:` dependency's own dependencies don't get
// installed by a monorepo build that only runs `npm install` inside
// frontend/ — Vercel's build failed with exactly that unresolved import.
// Regenerate this file directly if the contract's interface changes.
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type { Option, u64 } from "@stellar/stellar-sdk/contract";

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCVFIMTLHN2YFVKFITJYU4PWDIGNG2Q7AWWF4GPKBUBQOJEOGRDTIK5K",
  },
} as const;

export const Errors = {
  1: { message: "AlreadyInitialized" },
  2: { message: "NotInitialized" },
  3: { message: "AlreadyMinted" },
};

export interface Certificate {
  course: string;
  issued_at: u64;
  learner: string;
}

export interface Client {
  /** One-time setup: sets the admin address authorized to mint certificates. */
  initialize: (
    { admin }: { admin: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<Result<void>>>;

  /** The certificate record for `learner`/`course`, if one has been minted. */
  get_certificate: (
    { learner, course }: { learner: string; course: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<Option<Certificate>>>;

  /** Whether `learner` already holds a certificate for `course`. */
  has_certificate: (
    { learner, course }: { learner: string; course: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Mint a completion certificate for `learner` on `course`. Requires the
   * admin's authorization — the platform verifies course completion
   * off-chain and signs this on the learner's behalf.
   */
  mint_certificate: (
    { learner, course }: { learner: string; course: string },
    options?: MethodOptions
  ) => Promise<AssembledTransaction<Result<void>>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANQWxyZWFkeU1pbnRlZAAAAAAAAAM=",
        "AAAAAQAAAAAAAAAAAAAAC0NlcnRpZmljYXRlAAAAAAMAAAAAAAAABmNvdXJzZQAAAAAAEQAAAAAAAAAJaXNzdWVkX2F0AAAAAAAABgAAAAAAAAAHbGVhcm5lcgAAAAAT",
        "AAAABQAAAAAAAAAAAAAAEUNlcnRpZmljYXRlTWludGVkAAAAAAAAAQAAAARtaW50AAAAAgAAAAAAAAAHbGVhcm5lcgAAAAATAAAAAQAAAAAAAAAGY291cnNlAAAAAAARAAAAAAAAAAI=",
        "AAAAAAAAAEdPbmUtdGltZSBzZXR1cDogc2V0cyB0aGUgYWRtaW4gYWRkcmVzcyBhdXRob3JpemVkIHRvIG1pbnQgY2VydGlmaWNhdGVzLgAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAEZUaGUgY2VydGlmaWNhdGUgcmVjb3JkIGZvciBgbGVhcm5lcmAvYGNvdXJzZWAsIGlmIG9uZSBoYXMgYmVlbiBtaW50ZWQuAAAAAAAPZ2V0X2NlcnRpZmljYXRlAAAAAAIAAAAAAAAAB2xlYXJuZXIAAAAAEwAAAAAAAAAGY291cnNlAAAAAAARAAAAAQAAA+gAAAfQAAAAC0NlcnRpZmljYXRlAA==",
        "AAAAAAAAADtXaGV0aGVyIGBsZWFybmVyYCBhbHJlYWR5IGhvbGRzIGEgY2VydGlmaWNhdGUgZm9yIGBjb3Vyc2VgLgAAAAAPaGFzX2NlcnRpZmljYXRlAAAAAAIAAAAAAAAAB2xlYXJuZXIAAAAAEwAAAAAAAAAGY291cnNlAAAAAAARAAAAAQAAAAE=",
        "AAAAAAAAALlNaW50IGEgY29tcGxldGlvbiBjZXJ0aWZpY2F0ZSBmb3IgYGxlYXJuZXJgIG9uIGBjb3Vyc2VgLiBSZXF1aXJlcyB0aGUKYWRtaW4ncyBhdXRob3JpemF0aW9uIOKAlCB0aGUgcGxhdGZvcm0gdmVyaWZpZXMgY291cnNlIGNvbXBsZXRpb24Kb2ZmLWNoYWluIGFuZCBzaWducyB0aGlzIG9uIHRoZSBsZWFybmVyJ3MgYmVoYWxmLgAAAAAAABBtaW50X2NlcnRpZmljYXRlAAAAAgAAAAAAAAAHbGVhcm5lcgAAAAATAAAAAAAAAAZjb3Vyc2UAAAAAABEAAAABAAAD6QAAAAIAAAAD",
      ]),
      options
    );
  }
}
