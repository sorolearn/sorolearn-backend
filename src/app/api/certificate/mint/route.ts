import { NextRequest, NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { COURSES } from "@/lib/courses";
import { ContractAlreadyMintedError, mintCertificateOnChain } from "@/lib/certificate-contract";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const learner = body?.learner;
  const course = body?.course;

  if (typeof learner !== "string" || !StrKey.isValidEd25519PublicKey(learner)) {
    return NextResponse.json({ error: "Invalid learner address" }, { status: 400 });
  }
  if (typeof course !== "string" || !COURSES.some((c) => c.slug === course)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  try {
    const txHash = await mintCertificateOnChain(learner, course);
    return NextResponse.json({ txHash });
  } catch (err) {
    if (err instanceof ContractAlreadyMintedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("mint_certificate failed", err);
    return NextResponse.json({ error: "Mint failed" }, { status: 500 });
  }
}
