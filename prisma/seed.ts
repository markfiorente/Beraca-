import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { computeLoanSummary } from "../src/lib/finance";

// Load env vars
import * as fs from "fs";
import * as path from "path";

function loadEnv(file: string) {
  try {
    const envPath = path.join(process.cwd(), file);
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {}
}

loadEnv(".env.local");
loadEnv(".env");

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("🌱 Seeding Beraca database...");

  // Clear existing data
  await prisma.creditPayment.deleteMany();
  await prisma.amortizationEntry.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.savingsAccount.deleteMany();
  await prisma.user.deleteMany();

  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador Beraca",
      email: "admin@beraca.com",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "300-000-0000",
      document: "CC 1000000000",
      savingsAccount: {
        create: { balance: 0, accountNumber: "BRC-0000" },
      },
    },
  });

  // Members
  const membersData = [
    { name: "Ana María Rodríguez", email: "ana@beraca.com", phone: "311-111-1111", doc: "CC 1001001001" },
    { name: "Carlos Herrera Gómez", email: "carlos@beraca.com", phone: "312-222-2222", doc: "CC 1002002002" },
    { name: "María Fernanda López", email: "maria@beraca.com", phone: "313-333-3333", doc: "CC 1003003003" },
    { name: "Juan Esteban Morales", email: "juan@beraca.com", phone: "314-444-4444", doc: "CC 1004004004" },
    { name: "Luisa Alejandra Torres", email: "luisa@beraca.com", phone: "315-555-5555", doc: "CC 1005005005" },
  ];

  const memberHash = await bcrypt.hash("member123", 12);
  const members: Array<{ id: string; savingsAccount: { id: string } | null }> = [];

  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i];
    const user = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        passwordHash: memberHash,
        role: "MEMBER",
        phone: m.phone,
        document: m.doc,
        memberSince: new Date(2023, i, 15),
        savingsAccount: {
          create: { balance: 0, accountNumber: `BRC-${String(i + 1).padStart(4, "0")}` },
        },
      },
      include: { savingsAccount: true },
    });
    members.push(user as typeof user & { savingsAccount: { id: string } | null });
  }

  // Add 6 monthly savings deposits for each member
  const depositAmounts = [500000, 800000, 1200000, 600000, 900000];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const account = (member as { savingsAccount: { id: string } | null }).savingsAccount;
    if (!account) continue;
    let balance = 0;

    for (let month = 6; month >= 1; month--) {
      const amount = depositAmounts[i];
      balance += amount;
      const txDate = new Date(2024, 12 - month, 5);
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: "DEPOSIT",
          amount,
          balanceAfter: balance,
          description: `Aporte mensual — ${txDate.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`,
          performedById: admin.id,
          transactionDate: txDate,
        },
      });
    }

    await prisma.savingsAccount.update({
      where: { id: account.id },
      data: { balance },
    });
  }

  // Create 2 active credits
  const creditConfigs = [
    { memberIndex: 0, principal: 2000000, termMonths: 12 },
    { memberIndex: 2, principal: 5000000, termMonths: 24 },
  ];

  for (const cfg of creditConfigs) {
    const member = members[cfg.memberIndex];
    const summary = computeLoanSummary(cfg.principal, cfg.termMonths);
    const disbursedAt = new Date(2024, 7, 1);

    const credit = await prisma.credit.create({
      data: {
        userId: member.id,
        principal: cfg.principal,
        monthlyRate: 0.01,
        termMonths: cfg.termMonths,
        monthlyPayment: summary.monthlyPayment,
        totalInterest: summary.totalInterest,
        totalToPay: summary.totalToPay,
        disbursedAt,
        status: "ACTIVE",
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

    // Add 3 payments to first credit
    if (cfg.memberIndex === 0) {
      for (let p = 1; p <= 3; p++) {
        await prisma.creditPayment.create({
          data: {
            creditId: credit.id,
            userId: member.id,
            amount: summary.monthlyPayment,
            paymentDate: new Date(2024, 7 + p, 5),
            method: "TRANSFER",
            reference: `TRF-2024-${String(p).padStart(3, "0")}`,
          },
        });
      }
    }
  }

  // Create 1 paid credit
  const paidMember = members[3];
  const paidSummary = computeLoanSummary(1500000, 6);
  const paidCredit = await prisma.credit.create({
    data: {
      userId: paidMember.id,
      principal: 1500000,
      monthlyRate: 0.01,
      termMonths: 6,
      monthlyPayment: paidSummary.monthlyPayment,
      totalInterest: paidSummary.totalInterest,
      totalToPay: paidSummary.totalToPay,
      disbursedAt: new Date(2024, 0, 1),
      status: "PAID",
      amortization: {
        create: paidSummary.amortization.map((row) => ({
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

  for (let p = 0; p < 6; p++) {
    const entry = paidSummary.amortization[p];
    await prisma.creditPayment.create({
      data: {
        creditId: paidCredit.id,
        userId: paidMember.id,
        amount: entry.paymentAmount,
        paymentDate: new Date(2024, 1 + p, 5),
        method: "TRANSFER",
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log("   Admin: admin@beraca.com / admin123");
  console.log("   Members password: member123");
  console.log("   (ana, carlos, maria, juan, luisa)@beraca.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
