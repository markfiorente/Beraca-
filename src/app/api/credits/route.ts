import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credits = await prisma.credit.findMany({
    where: { userId: session.user.id },
    include: { payments: true },
    orderBy: { disbursedAt: "desc" },
  });

  return NextResponse.json(
    credits.map((c) => {
      const paidAmount = c.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      const remainingBalance = Math.max(0, parseFloat(String(c.totalToPay)) - paidAmount);
      return {
        id: c.id,
        principal: parseFloat(String(c.principal)),
        monthlyRate: parseFloat(String(c.monthlyRate)),
        termMonths: c.termMonths,
        monthlyPayment: parseFloat(String(c.monthlyPayment)),
        totalInterest: parseFloat(String(c.totalInterest)),
        totalToPay: parseFloat(String(c.totalToPay)),
        disbursedAt: c.disbursedAt,
        status: c.status,
        notes: c.notes,
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
      };
    })
  );
}
