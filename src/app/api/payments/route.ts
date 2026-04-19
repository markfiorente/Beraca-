import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { paymentSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { creditId, amount, method, reference, notes } = parsed.data;

  // Verify credit belongs to user
  const credit = await prisma.credit.findUnique({
    where: { id: creditId },
    include: { payments: true },
  });

  if (!credit) return NextResponse.json({ error: "Crédito no encontrado" }, { status: 404 });
  if (credit.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (credit.status !== "ACTIVE") return NextResponse.json({ error: "El crédito no está activo" }, { status: 400 });

  const paidSoFar = credit.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const remaining = parseFloat(String(credit.totalToPay)) - paidSoFar;

  if (amount > remaining + 0.01) {
    return NextResponse.json({ error: "El monto supera el saldo pendiente" }, { status: 400 });
  }

  const payment = await prisma.creditPayment.create({
    data: {
      creditId,
      userId: session.user.id,
      amount,
      method: method as "CASH" | "TRANSFER" | "ONLINE" | "OTHER",
      reference,
      notes,
    },
  });

  // Mark credit as PAID if fully paid
  const newPaid = paidSoFar + amount;
  if (newPaid >= parseFloat(String(credit.totalToPay)) - 0.01) {
    await prisma.credit.update({ where: { id: creditId }, data: { status: "PAID" } });
  }

  return NextResponse.json({ success: true, payment: { id: payment.id, amount, paymentDate: payment.paymentDate } });
}
