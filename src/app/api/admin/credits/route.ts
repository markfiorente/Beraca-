import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { creditSchema } from "@/lib/validations";
import { computeLoanSummary } from "@/lib/finance";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const credits = await prisma.credit.findMany({
    include: { user: { select: { name: true, email: true } }, payments: true },
    orderBy: { disbursedAt: "desc" },
  });

  return NextResponse.json(
    credits.map((c) => {
      const paidAmount = c.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      return {
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userEmail: c.user.email,
        principal: parseFloat(String(c.principal)),
        monthlyPayment: parseFloat(String(c.monthlyPayment)),
        totalToPay: parseFloat(String(c.totalToPay)),
        termMonths: c.termMonths,
        disbursedAt: c.disbursedAt,
        status: c.status,
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        remainingBalance: parseFloat(Math.max(0, parseFloat(String(c.totalToPay)) - paidAmount).toFixed(2)),
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = creditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { userId, principal, termMonths, notes } = parsed.data;

  const summary = computeLoanSummary(principal, termMonths);

  const credit = await prisma.credit.create({
    data: {
      userId,
      principal,
      monthlyRate: 0.01,
      termMonths,
      monthlyPayment: summary.monthlyPayment,
      totalInterest: summary.totalInterest,
      totalToPay: summary.totalToPay,
      notes,
      amortization: {
        create: summary.amortization.map((row) => ({
          period: row.period,
          paymentAmount: row.paymentAmount,
          principalPart: row.principalPart,
          interestPart: row.interestPart,
          balance: row.balance,
          dueDate: row.dueDate,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, creditId: credit.id }, { status: 201 });
}
