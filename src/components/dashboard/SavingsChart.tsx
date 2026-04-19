"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionData } from "@/types";

interface SavingsChartProps {
  transactions: TransactionData[];
}

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-light border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export function SavingsChart({ transactions }: SavingsChartProps) {
  const data = transactions
    .slice()
    .reverse()
    .slice(-12)
    .map((tx) => ({
      date: formatDate(tx.transactionDate),
      balance: parseFloat(String(tx.balanceAfter)),
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#c9a84c"
          strokeWidth={2}
          fill="url(#goldGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#c9a84c", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
