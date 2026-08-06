import { NextRequest, NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { COURSES } from "@/lib/courses";
import { hasCertificateOnChain } from "@/lib/certificate-contract";

export async function GET(req: NextRequest) {
  const learner = req.nextUrl.searchParams.get("learner");
  const course = req.nextUrl.searchParams.get("course");

  if (!learner || !StrKey.isValidEd25519PublicKey(learner)) {
    return NextResponse.json({ error: "Invalid learner address" }, { status: 400 });
  }
  if (!course || !COURSES.some((c) => c.slug === course)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  try {
    const hasCertificate = await hasCertificateOnChain(learner, course);
    return NextResponse.json({ hasCertificate });
  } catch (err) {
    console.error("has_certificate failed", err);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
