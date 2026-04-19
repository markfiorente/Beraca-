import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [members, activeCredits, accounts] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.credit.count({ where: { status: "ACTIVE" } }),
    prisma.savingsAccount.aggregate({ _sum: { balance: true } }),
  ]);

  const totalSavings = parseFloat(String(accounts._sum.balance ?? 0));

  const recentMembers = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { memberSince: "desc" },
    take: 5,
    include: { savingsAccount: true },
  });

  const recentCredits = await prisma.credit.findMany({
    orderBy: { disbursedAt: "desc" },
    take: 5,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-slate-400 text-sm mt-1">Vista global del Fondo Beraca</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Miembros Activos" value={String(members)} icon={Users} variant="default" />
        <MetricCard title="Total en Ahorros" value={formatCurrency(totalSavings)} icon={PiggyBank} variant="gold" />
        <MetricCard title="Créditos Activos" value={String(activeCredits)} icon={CreditCard} variant="default" />
        <MetricCard title="Rendimiento Mensual" value="1% E.M." subtitle="Tasa única del fondo" icon={TrendingUp} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Miembros Recientes</CardTitle>
            <Link href="/admin/members" className="text-xs text-gold hover:text-gold-light">Ver todos →</Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {recentMembers.map((m) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(m.memberSince)}</p>
                </div>
                <p className="text-sm font-semibold text-gold">
                  {formatCurrency(m.savingsAccount ? parseFloat(String(m.savingsAccount.balance)) : 0)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Créditos Recientes</CardTitle>
            <Link href="/admin/credits" className="text-xs text-gold hover:text-gold-light">Ver todos →</Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {recentCredits.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{c.user.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(parseFloat(String(c.principal)))} · {c.termMonths} meses</p>
                </div>
                <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "PAID" ? "secondary" : "destructive"}>
                  {c.status === "ACTIVE" ? "Activo" : c.status === "PAID" ? "Pagado" : "Mora"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/members", label: "Gestionar Miembros", icon: Users },
          { href: "/admin/transactions", label: "Nueva Transacción", icon: PiggyBank },
          { href: "/admin/credits/new", label: "Crear Crédito", icon: CreditCard },
          { href: "/admin/credits", label: "Ver Créditos", icon: TrendingUp },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 bg-navy-light border border-white/10 rounded-xl p-4 hover:border-gold/30 hover:bg-navy-medium/50 transition-all text-center"
          >
            <Icon className="h-6 w-6 text-gold" />
            <p className="text-xs text-slate-300">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
