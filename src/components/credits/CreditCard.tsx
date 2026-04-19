import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard as CreditIcon, ChevronRight } from "lucide-react";
import type { CreditData } from "@/types";

const statusConfig = {
  ACTIVE: { label: "Activo", variant: "success" as const },
  PAID: { label: "Pagado", variant: "secondary" as const },
  DEFAULTED: { label: "En mora", variant: "destructive" as const },
};

export function CreditCard({ credit }: { credit: CreditData }) {
  const progress = Math.min(100, (credit.paidAmount / credit.totalToPay) * 100);
  const cfg = statusConfig[credit.status];

  return (
    <Link
      href={`/credits/${credit.id}`}
      className="block bg-navy-light border border-white/10 rounded-xl p-5 hover:border-gold/30 hover:bg-navy-medium/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold/10 border border-gold/20">
            <CreditIcon className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Crédito {credit.termMonths} meses</p>
            <p className="text-xs text-slate-500">Desembolsado {formatDate(credit.disbursedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-gold transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Capital</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(credit.principal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Cuota mensual</p>
          <p className="text-sm font-semibold text-gold">{formatCurrency(credit.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Saldo pendiente</p>
          <p className="text-sm font-semibold text-red-400">{formatCurrency(credit.remainingBalance)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Pagado {formatCurrency(credit.paidAmount)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
