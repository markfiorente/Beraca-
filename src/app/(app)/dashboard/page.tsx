import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SavingsChart } from "@/components/dashboard/SavingsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PiggyBank, CreditCard, TrendingDown, Calendar } from "lucide-react";
import type { DashboardData } from "@/types";
import Link from "next/link";

async function getDashboard(userId: string): Promise<DashboardData | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savingsAccount: {
          include: {
            transactions: { orderBy: { transactionDate: "desc" }, take: 10 },
          },
        },
        credits: {
          where: { status: "ACTIVE" },
          include: { amortization: { orderBy: { period: "asc" } }, payments: true },
        },
      },
    });

    if (!user?.savingsAccount) return null;

    const activeCredits = user.credits;
    const totalCreditBalance = activeCredits.reduce((sum, c) => {
      const paid = c.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      return sum + Math.max(0, parseFloat(String(c.totalToPay)) - paid);
    }, 0);

    let nextPayment = null;
    for (const credit of activeCredits) {
      const paid = credit.payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
      const paidPeriods = Math.floor(paid / parseFloat(String(credit.monthlyPayment)));
      const nextEntry = credit.amortization[paidPeriods];
      if (nextEntry) {
        nextPayment = {
          amount: parseFloat(String(nextEntry.paymentAmount)),
          dueDate: nextEntry.dueDate,
          creditId: credit.id,
        };
        break;
      }
    }

    return {
      savingsBalance: parseFloat(String(user.savingsAccount.balance)),
      accountNumber: user.savingsAccount.accountNumber,
      activeCredits: activeCredits.length,
      totalCreditBalance: parseFloat(totalCreditBalance.toFixed(2)),
      nextPayment,
      recentTransactions: user.savingsAccount.transactions.map((t) => ({
        id: t.id,
        type: t.type as "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE",
        amount: parseFloat(String(t.amount)),
        balanceAfter: parseFloat(String(t.balanceAfter)),
        description: t.description,
        reference: t.reference,
        transactionDate: t.transactionDate,
      })),
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getDashboard(session.user.id);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No se encontró información de cuenta. Contacta al administrador.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, <span className="text-gradient-gold">{session.user.name.split(" ")[0]}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Cuenta {data.accountNumber} · Resumen al {formatDate(new Date())}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo en Ahorros"
          value={formatCurrency(data.savingsBalance)}
          subtitle={`Cuenta ${data.accountNumber}`}
          icon={PiggyBank}
          variant="gold"
        />
        <MetricCard
          title="Créditos Activos"
          value={String(data.activeCredits)}
          subtitle={data.activeCredits === 0 ? "Sin créditos vigentes" : "Créditos vigentes"}
          icon={CreditCard}
          variant="default"
        />
        <MetricCard
          title="Saldo por Pagar"
          value={formatCurrency(data.totalCreditBalance)}
          subtitle="Total créditos activos"
          icon={TrendingDown}
          variant={data.totalCreditBalance > 0 ? "danger" : "success"}
        />
        <MetricCard
          title="Próxima Cuota"
          value={data.nextPayment ? formatCurrency(data.nextPayment.amount) : "—"}
          subtitle={data.nextPayment ? `Vence: ${formatDate(data.nextPayment.dueDate)}` : "Sin cuotas pendientes"}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Chart + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Evolución de Ahorros</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsChart transactions={data.recentTransactions} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Últimas Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={data.recentTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      {data.nextPayment && (
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Tienes una cuota próxima a vencer</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatCurrency(data.nextPayment.amount)} · Vence {formatDate(data.nextPayment.dueDate)}
              </p>
            </div>
            <Link
              href="/payments"
              className="flex-shrink-0 bg-gold text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gold-light transition-colors"
            >
              Pagar ahora
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
