import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      savingsAccount: {
        include: {
          transactions: {
            orderBy: { transactionDate: "desc" },
            take: 5,
          },
        },
      },
      credits: {
        where: { status: "ACTIVE" },
        include: {
          amortization: { orderBy: { period: "asc" } },
          payments: true,
        },
      },
    },
  });

  if (!user || !user.savingsAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const activeCredits = user.credits.filter((c) => c.status === "ACTIVE");
  const totalCreditBalance = activeCredits.reduce((sum, c) => {
    const paid = c.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
    return sum + Math.max(0, parseFloat(String(c.totalToPay)) - paid);
  }, 0);

  // Find next payment due
  const nextPayment = activeCredits.length > 0
    ? (() => {
        const today = new Date();
        let earliest: { amount: number; dueDate: Date; creditId: string } | null = null;
        for (const credit of activeCredits) {
          const paid = credit.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
          const paidPeriods = Math.floor(paid / parseFloat(String(credit.monthlyPayment)));
          const nextEntry = credit.amortization[paidPeriods];
          if (nextEntry && (!earliest || nextEntry.dueDate < earliest.dueDate)) {
            earliest = {
              amount: parseFloat(String(nextEntry.paymentAmount)),
              dueDate: nextEntry.dueDate,
              creditId: credit.id,
            };
          }
        }
        return earliest;
      })()
    : null;

  return NextResponse.json({
    savingsBalance: parseFloat(String(user.savingsAccount.balance)),
    accountNumber: user.savingsAccount.accountNumber,
    activeCredits: activeCredits.length,
    totalCreditBalance: parseFloat(totalCreditBalance.toFixed(2)),
    nextPayment,
    recentTransactions: user.savingsAccount.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(String(t.amount)),
      balanceAfter: parseFloat(String(t.balanceAfter)),
      description: t.description,
      reference: t.reference,
      transactionDate: t.transactionDate,
    })),
  });
}
