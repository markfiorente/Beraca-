"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, User, PiggyBank, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { TransactionTable } from "@/components/savings/TransactionTable";
import type { TransactionData } from "@/types";

interface MemberDetail {
  id: string; name: string; email: string; role: string; phone?: string | null;
  document?: string | null; memberSince: string; isActive: boolean;
  savingsAccount?: {
    id: string; balance: number; accountNumber: string;
    transactions: (TransactionData & { transactionDate: string })[];
  } | null;
  credits: Array<{
    id: string; principal: number; monthlyPayment: number; totalToPay: number;
    termMonths: number; disbursedAt: string; status: string; paidAmount: number; remainingBalance: number;
  }>;
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/admin/members/${id}`)
      .then((r) => r.json())
      .then(setMember)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleActive() {
    if (!member) return;
    setToggling(true);
    await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    load();
    setToggling(false);
  }

  if (loading) return <div className="text-slate-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>;
  if (!member) return <p className="text-slate-400">Miembro no encontrado</p>;

  const transactions: TransactionData[] = (member.savingsAccount?.transactions ?? []).map((t) => ({
    ...t,
    type: t.type as "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE",
    transactionDate: new Date(t.transactionDate),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin/members" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{member.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Miembro desde {formatDate(member.memberSince)}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleActive}
          disabled={toggling}
          className={member.isActive ? "border-red-500/40 text-red-400 hover:bg-red-500/10" : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"}
        >
          {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : member.isActive ? "Desactivar" : "Activar"}
        </Button>
      </div>

      {/* Profile info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-light border border-white/10 rounded-xl p-4 col-span-2">
          <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm">
            <User className="h-4 w-4" /> Información personal
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p className="text-slate-500">Email</p><p className="text-white">{member.email}</p>
            <p className="text-slate-500">Teléfono</p><p className="text-white">{member.phone ?? "—"}</p>
            <p className="text-slate-500">Documento</p><p className="text-white">{member.document ?? "—"}</p>
            <p className="text-slate-500">Rol</p>
            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>{member.role === "ADMIN" ? "Admin" : "Miembro"}</Badge>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
            <PiggyBank className="h-4 w-4" /> Ahorros
          </div>
          <p className="text-2xl font-bold text-gold">{formatCurrency(member.savingsAccount?.balance ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{member.savingsAccount?.accountNumber}</p>
        </div>
        <div className="bg-navy-light border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
            <CreditCard className="h-4 w-4" /> Créditos
          </div>
          <p className="text-2xl font-bold text-white">{member.credits.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {member.credits.filter(c => c.status === "ACTIVE").length} activos
          </p>
        </div>
      </div>

      {/* Credits list */}
      {member.credits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Créditos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {member.credits.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-navy/50 rounded-lg border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{formatCurrency(c.principal)} · {c.termMonths || "—"} meses</p>
                    <p className="text-xs text-slate-500">Desembolsado {formatDate(c.disbursedAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "PAID" ? "secondary" : "destructive"}>
                      {c.status === "ACTIVE" ? "Activo" : c.status === "PAID" ? "Pagado" : "Mora"}
                    </Badge>
                    <p className="text-xs text-red-400 mt-1">{formatCurrency(c.remainingBalance)} pendiente</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Estado de Cuenta</CardTitle>
          <Link
            href={`/admin/transactions?account=${member.savingsAccount?.id}`}
            className="text-xs text-gold hover:text-gold-light"
          >
            + Nueva transacción
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          <TransactionTable
            transactions={transactions}
            pagination={{ page: 1, pages: 1, total: transactions.length }}
            onPageChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
