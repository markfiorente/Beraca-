import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { transactionSchema } from "@/lib/validations";
import Decimal from "decimal.js";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { accountId, type, amount, description, reference } = parsed.data;

  const account = await prisma.savingsAccount.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

  const currentBalance = new Decimal(String(account.balance));
  const txAmount = new Decimal(amount);

  if ((type === "WITHDRAWAL" || type === "FEE") && txAmount.greaterThan(currentBalance)) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }

  const newBalance = (type === "DEPOSIT" || type === "INTEREST")
    ? currentBalance.plus(txAmount)
    : currentBalance.minus(txAmount);

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId,
        type: type as "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE",
        amount,
        balanceAfter: newBalance.toNumber(),
        description,
        reference,
        performedById: session.user.id,
      },
    }),
    prisma.savingsAccount.update({
      where: { id: accountId },
      data: { balance: newBalance.toNumber() },
    }),
  ]);

  return NextResponse.json({ success: true, transactionId: transaction.id }, { status: 201 });
}
