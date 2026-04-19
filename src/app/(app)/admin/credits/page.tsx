"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface AdminCredit {
  id: string; userId: string; userName: string; userEmail: string;
  principal: number; monthlyPayment: number; totalToPay: number;
  termMonths: number; disbursedAt: string; status: "ACTIVE" | "PAID" | "DEFAULTED";
  paidAmount: number; remainingBalance: number;
}

const statusConfig = {
  ACTIVE: { label: "Activo", variant: "success" as const },
  PAID: { label: "Pagado", variant: "secondary" as const },
  DEFAULTED: { label: "En mora", variant: "destructive" as const },
};

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<AdminCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAID" | "DEFAULTED">("ALL");

  useEffect(() => {
    fetch("/api/admin/credits")
      .then((r) => r.json())
      .then(setCredits)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? credits : credits.filter((c) => c.status === filter);
  const totalActive = credits.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + c.remainingBalance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Créditos</h1>
          <p className="text-slate-400 text-sm mt-1">
            {credits.filter(c => c.status === "ACTIVE").length} activos · {formatCurrency(totalActive)} en cartera
          </p>
        </div>
        <Link href="/admin/credits/new">
          <Button><Plus className="h-4 w-4" /> Nuevo Crédito</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["ALL", "ACTIVE", "PAID", "DEFAULTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === s ? "bg-gold/20 text-gold border border-gold/30" : "text-slate-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {s === "ALL" ? "Todos" : s === "ACTIVE" ? "Activos" : s === "PAID" ? "Pagados" : "En Mora"}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-navy-medium/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Miembro</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Capital</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cuota</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Plazo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pendiente</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Desembolso</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Cargando...
                  </td></tr>
                ) : filtered.map((c) => {
                  const cfg = statusConfig[c.status];
                  const progress = Math.min(100, (c.paidAmount / c.totalToPay) * 100);
                  return (
                    <tr key={c.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{c.userName}</p>
                        <p className="text-xs text-slate-500">{c.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{formatCurrency(c.principal)}</td>
                      <td className="px-4 py-3 text-right text-gold">{formatCurrency(c.monthlyPayment)}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{c.termMonths}m</td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-red-400 font-semibold">{formatCurrency(c.remainingBalance)}</p>
                        <div className="h-1 bg-white/10 rounded-full mt-1 w-16 ml-auto">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(c.disbursedAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/credits/${c.id}`} className="text-xs text-gold hover:text-gold-light">Ver →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
