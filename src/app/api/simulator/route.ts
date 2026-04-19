import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeLoanSummary } from "@/lib/finance";
import { simulatorSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = simulatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { amount, termMonths } = parsed.data;
  const summary = computeLoanSummary(amount, termMonths);

  return NextResponse.json(summary);
}
