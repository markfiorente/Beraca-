"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { simulatorSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calculator, Loader2, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import type { AmortizationRow } from "@/lib/finance";

type SimForm = z.infer<typeof simulatorSchema>;

interface SimResult {
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  amortization: (AmortizationRow & { dueDate: string })[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-light border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-slate-400 mb-1">Período {label}</p>
        {payload.map((p) => (
          <p key={p.name} className={p.name === "interestPart" ? "text-gold" : "text-emerald-400"}>
            {p.name === "interestPart" ? "Interés" : "Capital"}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function SimulatorPage() {
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SimForm>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: { amount: 1000000, termMonths: 12 },
  });

  async function onSubmit(data: SimForm) {
    setLoading(true);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json);
    } finally {
      setLoading(false);
    }
  }

  // Chart shows first 24 periods max
  const chartData = result?.amortization.slice(0, 24).map((row) => ({
    period: row.period,
    principalPart: row.principalPart,
    interestPart: row.interestPart,
  })) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulador de Crédito</h1>
        <p className="text-slate-400 text-sm mt-1">Tasa: 1% efectivo mensual · Amortización francesa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-gold" />
              Parámetros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto del crédito (COP)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1,000,000"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termMonths">Plazo (meses)</Label>
                <Input
                  id="termMonths"
                  type="number"
                  placeholder="12"
                  min={1}
                  max={120}
                  {...register("termMonths", { valueAsNumber: true })}
                />
                {errors.termMonths && <p className="text-red-400 text-xs">{errors.termMonths.message}</p>}
              </div>

              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-xs text-slate-400">
                <p className="text-gold font-semibold mb-1">Condiciones del fondo</p>
                <p>• Tasa: 1% efectivo mensual</p>
                <p>• Sistema de amortización francesa</p>
                <p>• Cuota fija durante todo el plazo</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculando...</> : "Calcular"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cuota mensual", value: formatCurrency(result.monthlyPayment), color: "text-gold" },
                  { label: "Total intereses", value: formatCurrency(result.totalInterest), color: "text-amber-400" },
                  { label: "Total a pagar", value: formatCurrency(result.totalToPay), color: "text-white" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-navy-light border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" />
                    Composición de cuotas {result.amortization.length > 24 ? "(primeros 24 períodos)" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="period" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="principalPart" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                      <Bar dataKey="interestPart" stackId="a" fill="#c9a84c" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 justify-center text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Capital</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gold inline-block" /> Interés</span>
                  </div>
                </CardContent>
              </Card>

              {/* Amortization table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tabla de Amortización Completa</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto rounded-lg border border-white/5 max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-navy-light">
                        <tr className="border-b border-white/10">
                          <th className="text-center px-2 py-2 text-slate-500">#</th>
                          <th className="text-left px-2 py-2 text-slate-500">Vencimiento</th>
                          <th className="text-right px-2 py-2 text-slate-500">Cuota</th>
                          <th className="text-right px-2 py-2 text-slate-500">Capital</th>
                          <th className="text-right px-2 py-2 text-slate-500">Interés</th>
                          <th className="text-right px-2 py-2 text-slate-500">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {result.amortization.map((row) => (
                          <tr key={row.period} className="hover:bg-white/3">
                            <td className="px-2 py-2 text-center text-slate-500 font-mono">{row.period}</td>
                            <td className="px-2 py-2 text-slate-300 whitespace-nowrap">{formatDate(new Date(row.dueDate))}</td>
                            <td className="px-2 py-2 text-right font-semibold text-white">{formatCurrency(row.paymentAmount)}</td>
                            <td className="px-2 py-2 text-right text-emerald-400">{formatCurrency(row.principalPart)}</td>
                            <td className="px-2 py-2 text-right text-gold">{formatCurrency(row.interestPart)}</td>
                            <td className="px-2 py-2 text-right text-slate-300">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-slate-600 gap-3">
              <Calculator className="h-16 w-16 opacity-20" />
              <p className="text-sm">Ingresa los datos y presiona <strong className="text-slate-400">Calcular</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
