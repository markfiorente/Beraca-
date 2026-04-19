"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "@/components/savings/TransactionTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PiggyBank, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SavingsData {
  account: { id: string; balance: number; accountNumber: string; createdAt: string };
  transactions: Array<{
    id: string; type: "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE";
    amount: number; balanceAfter: number; description: string;
    reference?: string | null; transactionDate: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function SavingsPage() {
  const [data, setData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings?page=${p}&limit=20`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Ahorros</h1>
        <p className="text-slate-400 text-sm mt-1">Estado de cuenta y movimientos</p>
      </div>

      {/* Account summary */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-1 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-5 w-5 text-gold" />
              <p className="text-sm text-slate-400">Saldo Disponible</p>
            </div>
            <p className="text-3xl font-bold text-gold">{formatCurrency(data.account.balance)}</p>
            <p className="text-xs text-slate-500 mt-1">Cuenta {data.account.accountNumber}</p>
          </div>
          <div className="bg-navy-light border border-white/10 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-3">N° de Cuenta</p>
            <p className="text-2xl font-bold text-white">{data.account.accountNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Fondo Beraca</p>
          </div>
          <div className="bg-navy-light border border-white/10 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-3">Miembro desde</p>
            <p className="text-xl font-bold text-white">{formatDate(data.account.createdAt)}</p>
            <p className="text-xs text-slate-500 mt-1">{data.pagination.total} transacciones</p>
          </div>
        </div>
      ) : null}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : data ? (
            <TransactionTable
              transactions={data.transactions.map(t => ({ ...t, transactionDate: new Date(t.transactionDate) }))}
              pagination={data.pagination}
              onPageChange={setPage}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
