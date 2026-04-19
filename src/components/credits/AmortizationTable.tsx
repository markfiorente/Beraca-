import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AmortizationEntryData } from "@/types";

interface AmortizationTableProps {
  entries: AmortizationEntryData[];
  paidAmount: number;
  monthlyPayment: number;
}

export function AmortizationTable({ entries, paidAmount, monthlyPayment }: AmortizationTableProps) {
  const paidPeriods = Math.floor(paidAmount / monthlyPayment);

  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-navy-medium/30">
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
            <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuota</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Interés</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((entry) => {
            const isPaid = entry.period <= paidPeriods;
            const isCurrent = entry.period === paidPeriods + 1;
            return (
              <tr
                key={entry.id}
                className={cn(
                  "transition-colors",
                  isPaid ? "opacity-50" : "hover:bg-white/3",
                  isCurrent ? "bg-gold/5 border-l-2 border-gold" : ""
                )}
              >
                <td className={cn("px-3 py-2.5 text-center font-mono text-xs", isCurrent ? "text-gold font-bold" : "text-slate-500")}>
                  {entry.period}
                </td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{formatDate(entry.dueDate)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-white whitespace-nowrap">{formatCurrency(entry.paymentAmount)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-400 whitespace-nowrap">{formatCurrency(entry.principalPart)}</td>
                <td className="px-3 py-2.5 text-right text-gold whitespace-nowrap">{formatCurrency(entry.interestPart)}</td>
                <td className="px-3 py-2.5 text-right text-slate-300 whitespace-nowrap">{formatCurrency(entry.balance)}</td>
                <td className="px-3 py-2.5 text-center">
                  {isPaid ? (
                    <span className="text-xs text-emerald-400">✓ Pagada</span>
                  ) : isCurrent ? (
                    <span className="text-xs text-gold font-semibold">← Vigente</span>
                  ) : (
                    <span className="text-xs text-slate-600">Pendiente</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-white/10">
          <tr className="bg-navy-medium/20">
            <td colSpan={2} className="px-3 py-3 text-xs font-semibold text-slate-400">TOTALES</td>
            <td className="px-3 py-3 text-right text-sm font-bold text-white">
              {formatCurrency(entries.reduce((s, e) => s + e.paymentAmount, 0))}
            </td>
            <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-400">
              {formatCurrency(entries.reduce((s, e) => s + e.principalPart, 0))}
            </td>
            <td className="px-3 py-3 text-right text-sm font-semibold text-gold">
              {formatCurrency(entries.reduce((s, e) => s + e.interestPart, 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
