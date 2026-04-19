import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Star, Minus } from "lucide-react";
import type { TransactionData } from "@/types";
import Link from "next/link";

const typeConfig = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  WITHDRAWAL: { label: "Retiro", icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-500/10" },
  INTEREST: { label: "Interés", icon: Star, color: "text-gold", bg: "bg-gold/10" },
  FEE: { label: "Cargo", icon: Minus, color: "text-slate-400", bg: "bg-slate-500/10" },
};

interface RecentTransactionsProps {
  transactions: TransactionData[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <p className="text-sm">Sin transacciones recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        const isPositive = tx.type === "DEPOSIT" || tx.type === "INTEREST";
        return (
          <div key={tx.id} className="flex items-center gap-3 py-2">
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${config.bg}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{tx.description}</p>
              <p className="text-xs text-slate-500">{formatDate(tx.transactionDate)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
              </p>
              <p className="text-xs text-slate-600">{formatCurrency(tx.balanceAfter)}</p>
            </div>
          </div>
        );
      })}
      <div className="pt-1 border-t border-white/5">
        <Link href="/savings" className="text-xs text-gold hover:text-gold-light transition-colors">
          Ver estado de cuenta completo →
        </Link>
      </div>
    </div>
  );
}
