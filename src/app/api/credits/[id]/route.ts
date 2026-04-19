import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const credit = await prisma.credit.findUnique({
    where: { id },
    include: {
      amortization: { orderBy: { period: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!credit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Members can only see their own credits
  if (credit.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paidAmount = credit.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);

  return NextResponse.json({
    id: credit.id,
    principal: parseFloat(String(credit.principal)),
    monthlyRate: parseFloat(String(credit.monthlyRate)),
    termMonths: credit.termMonths,
    monthlyPayment: parseFloat(String(credit.monthlyPayment)),
    totalInterest: parseFloat(String(credit.totalInterest)),
    totalToPay: parseFloat(String(credit.totalToPay)),
    disbursedAt: credit.disbursedAt,
    status: credit.status,
    notes: credit.notes,
    paidAmount: parseFloat(paidAmount.toFixed(2)),
    remainingBalance: parseFloat(Math.max(0, parseFloat(String(credit.totalToPay)) - paidAmount).toFixed(2)),
    amortization: credit.amortization.map((e) => ({
      id: e.id,
      period: e.period,
      paymentAmount: parseFloat(String(e.paymentAmount)),
      principalPart: parseFloat(String(e.principalPart)),
      interestPart: parseFloat(String(e.interestPart)),
      balance: parseFloat(String(e.balance)),
      dueDate: e.dueDate,
    })),
    payments: credit.payments.map((p) => ({
      id: p.id,
      amount: parseFloat(String(p.amount)),
      paymentDate: p.paymentDate,
      method: p.method,
      reference: p.reference,
      notes: p.notes,
    })),
  });
}
