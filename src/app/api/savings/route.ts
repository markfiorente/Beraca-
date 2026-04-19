import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const account = await prisma.savingsAccount.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
      },
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total = await prisma.transaction.count({ where: { accountId: account.id } });

  return NextResponse.json({
    account: {
      id: account.id,
      balance: parseFloat(String(account.balance)),
      accountNumber: account.accountNumber,
      createdAt: account.createdAt,
    },
    transactions: account.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(String(t.amount)),
      balanceAfter: parseFloat(String(t.balanceAfter)),
      description: t.description,
      reference: t.reference,
      transactionDate: t.transactionDate,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
