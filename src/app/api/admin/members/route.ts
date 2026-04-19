import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { memberSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

function requireAdmin(session: { user: { role: string } } | null): boolean {
  if (!session || session.user.role !== "ADMIN") return false;
  return true;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        savingsAccount: true,
        credits: { where: { status: "ACTIVE" } },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      phone: m.phone,
      document: m.document,
      memberSince: m.memberSince,
      isActive: m.isActive,
      savingsBalance: m.savingsAccount ? parseFloat(String(m.savingsAccount.balance)) : 0,
      accountNumber: m.savingsAccount?.accountNumber ?? null,
      activeCredits: m.credits.length,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { name, email, password, phone, document, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate account number
  const count = await prisma.user.count();
  const accountNumber = `BRC-${String(count + 1).padStart(4, "0")}`;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as "ADMIN" | "MEMBER",
      phone,
      document,
      savingsAccount: {
        create: { balance: 0, accountNumber },
      },
    },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
