import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      savingsAccount: {
        include: {
          transactions: { orderBy: { transactionDate: "desc" }, take: 30 },
        },
      },
      credits: {
        include: { payments: true },
        orderBy: { disbursedAt: "desc" },
      },
    },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    phone: member.phone,
    document: member.document,
    memberSince: member.memberSince,
    isActive: member.isActive,
    savingsAccount: member.savingsAccount
      ? {
          id: member.savingsAccount.id,
          balance: parseFloat(String(member.savingsAccount.balance)),
          accountNumber: member.savingsAccount.accountNumber,
          transactions: member.savingsAccount.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(String(t.amount)),
            balanceAfter: parseFloat(String(t.balanceAfter)),
            description: t.description,
            transactionDate: t.transactionDate,
          })),
        }
      : null,
    credits: member.credits.map((c) => {
      const paidAmount = c.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      return {
        id: c.id,
        principal: parseFloat(String(c.principal)),
        monthlyPayment: parseFloat(String(c.monthlyPayment)),
        totalToPay: parseFloat(String(c.totalToPay)),
        disbursedAt: c.disbursedAt,
        status: c.status,
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        remainingBalance: parseFloat(Math.max(0, parseFloat(String(c.totalToPay)) - paidAmount).toFixed(2)),
      };
    }),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["name", "phone", "document", "isActive", "role"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ success: true, id: updated.id });
}
