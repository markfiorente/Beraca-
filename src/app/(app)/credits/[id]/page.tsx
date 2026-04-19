"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AmortizationTable } from "@/components/credits/AmortizationTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { AmortizationEntryData } from "@/types";

interface CreditDetail {
  id: string;
  principal: number;
  monthlyPayment: number;
  totalInterest: number;
  totalToPay: number;
  termMonths: number;
  disbursedAt: string;
  status: "ACTIVE" | "PAID" | "DEFAULTED";
  notes?: string | null;
  paidAmount: number;
  remainingBalance: number;
  amortization: (AmortizationEntryData & { dueDate: string })[];
  payments: Array<{ id: string; amount: number; paymentDate: string; method: string; reference?: string | null }>;
}

const statusConfig = {
  ACTIVE: { label: "Activo", variant: "success" as const },
  PAID: { label: "Pagado", variant: "secondary" as const },
  DEFAULTED: { label: "En mora", variant: "destructive" as const },
};

export default function CreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [credit, setCredit] = useState<CreditDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/credits/${id}`)
      .then((r) => r.json())
      .then(setCredit)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );

  if (!credit) return <p className="text-slate-400">Crédito no encontrado</p>;

  const progress = Math.min(100, (credit.paidAmount / credit.totalToPay) * 100);
  const cfg = statusConfig[credit.status];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/credits" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Detalle del Crédito</h1>
          <p className="text-slate-400 text-sm mt-0.5">Desembolsado {formatDate(credit.disbursedAt)}</p>
        </div>
        <Badge variant={cfg.variant} className="ml-auto">{cfg.label}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Capital", value: formatCurrency(credit.principal), color: "text-white" },
          { label: "Cuota mensual", value: formatCurrency(credit.monthlyPayment), color: "text-gold" },
          { label: "Total intereses", value: formatCurrency(credit.totalInterest), color: "text-amber-400" },
          { label: "Total a pagar", value: formatCurrency(credit.totalToPay), color: "text-white" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-navy-light border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-400">Progreso de pago</p>
            <p className="text-sm font-semibold text-white">{Math.round(progress)}%</p>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Pagado: <span className="text-emerald-400 font-semibold">{formatCurrency(credit.paidAmount)}</span></span>
            <span>Pendiente: <span className="text-red-400 font-semibold">{formatCurrency(credit.remainingBalance)}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Amortization table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tabla de Amortización</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <AmortizationTable
            entries={credit.amortization.map((e) => ({ ...e, dueDate: new Date(e.dueDate) }))}
            paidAmount={credit.paidAmount}
            monthlyPayment={credit.monthlyPayment}
          />
        </CardContent>
      </Card>

      {/* Payment history */}
      {credit.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {credit.payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.paymentDate)} · {p.method}</p>
                </div>
                {p.reference && <p className="text-xs text-slate-600">Ref: {p.reference}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {credit.status === "ACTIVE" && (
        <div className="flex justify-end">
          <Link
            href="/payments"
            className="bg-gold text-navy font-semibold px-6 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
          >
            Registrar Pago
          </Link>
        </div>
      )}
    </div>
  );
}
