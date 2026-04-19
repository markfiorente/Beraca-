"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Star, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import type { TransactionData } from "@/types";

const typeConfig = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, variant: "success" as const },
  WITHDRAWAL: { label: "Retiro", icon: ArrowUpRight, variant: "destructive" as const },
  INTEREST: { label: "Interés", icon: Star, variant: "default" as const },
  FEE: { label: "Cargo", icon: Minus, variant: "secondary" as const },
};

interface TransactionTableProps {
  transactions: TransactionData[];
  pagination: { page: number; pages: number; total: number };
  onPageChange: (p: number) => void;
}

export function TransactionTable({ transactions, pagination, onPageChange }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p>Sin transacciones para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-navy-medium/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const cfg = typeConfig[tx.type];
              const Icon = cfg.icon;
              const isPos = tx.type === "DEPOSIT" || tx.type === "INTEREST";
              return (
                <tr key={tx.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant} className="gap-1 whitespace-nowrap">
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{tx.description}</td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                    {isPos ? "+" : "-"}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 whitespace-nowrap">{formatCurrency(tx.balanceAfter)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            {pagination.total} transacciones · Página {pagination.page} de {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
