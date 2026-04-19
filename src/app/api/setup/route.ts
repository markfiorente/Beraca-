import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { computeLoanSummary } from "@/lib/finance";

// One-time setup endpoint — disabled after first run
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json({ message: "Already seeded", users: existing });
  }

  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador Beraca",
      email: "admin@beraca.com",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "300-000-0000",
      document: "CC 1000000000",
      savingsAccount: { create: { balance: 0, accountNumber: "BRC-0000" } },
    },
  });

  const membersData = [
    { name: "Ana María Rodríguez", email: "ana@beraca.com", phone: "311-111-1111", doc: "CC 1001001001" },
    { name: "Carlos Herrera Gómez", email: "carlos@beraca.com", phone: "312-222-2222", doc: "CC 1002002002" },
    { name: "María Fernanda López", email: "maria@beraca.com", phone: "313-333-3333", doc: "CC 1003003003" },
    { name: "Juan Esteban Morales", email: "juan@beraca.com", phone: "314-444-4444", doc: "CC 1004004004" },
    { name: "Luisa Alejandra Torres", email: "luisa@beraca.com", phone: "315-555-5555", doc: "CC 1005005005" },
  ];

  const memberHash = await bcrypt.hash("member123", 12);
  const depositAmounts = [500000, 800000, 1200000, 600000, 900000];

  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i];
    const user = await prisma.user.create({
      data: {
        name: m.name, email: m.email, passwordHash: memberHash,
        role: "MEMBER", phone: m.phone, document: m.doc,
        memberSince: new Date(2023, i, 15),
        savingsAccount: { create: { balance: 0, accountNumber: `BRC-${String(i + 1).padStart(4, "0")}` } },
      },
      include: { savingsAccount: true },
    });

    const account = user.savingsAccount!;
    let balance = 0;
    for (let month = 6; month >= 1; month--) {
      const amount = depositAmounts[i];
      balance += amount;
      await prisma.transaction.create({
        data: {
          accountId: account.id, type: "DEPOSIT", amount,
          balanceAfter: balance,
          description: `Aporte mensual ${new Date(2024, 12 - month, 5).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`,
          performedById: admin.id,
          transactionDate: new Date(2024, 12 - month, 5),
        },
      });
    }
    await prisma.savingsAccount.update({ where: { id: account.id }, data: { balance } });

    // Credit for member 0 and 2
    if (i === 0 || i === 2) {
      const principal = i === 0 ? 2000000 : 5000000;
      const termMonths = i === 0 ? 12 : 24;
      const summary = computeLoanSummary(principal, termMonths);
      const credit = await prisma.credit.create({
        data: {
          userId: user.id, principal, monthlyRate: 0.01, termMonths,
          monthlyPayment: summary.monthlyPayment,
          totalInterest: summary.totalInterest,
          totalToPay: summary.totalToPay,
          disbursedAt: new Date(2024, 7, 1), status: "ACTIVE",
          amortization: {
            create: summary.amortization.map((row) => ({
              period: row.period, paymentAmount: row.paymentAmount,
              principalPart: row.principalPart, interestPart: row.interestPart,
              balance: row.balance, dueDate: row.dueDate,
            })),
          },
        },
      });
      if (i === 0) {
        for (let p = 1; p <= 3; p++) {
          await prisma.creditPayment.create({
            data: {
              creditId: credit.id, userId: user.id,
              amount: summary.monthlyPayment,
              paymentDate: new Date(2024, 7 + p, 5),
              method: "TRANSFER", reference: `TRF-2024-${String(p).padStart(3, "0")}`,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true, message: "Base de datos lista con datos demo" });
}
