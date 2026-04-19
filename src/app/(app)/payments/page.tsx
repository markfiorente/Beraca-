"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { CreditData } from "@/types";

type PayForm = z.infer<typeof paymentSchema>;

const methodLabels: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia bancaria",
  ONLINE: "Pago en línea",
  OTHER: "Otro",
};

export default function PaymentsPage() {
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedCredit, setSelectedCredit] = useState<CreditData | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PayForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "TRANSFER" },
  });

  const creditId = watch("creditId");

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data: CreditData[]) => {
        const active = data.filter((c) => c.status === "ACTIVE");
        setCredits(active);
      });
  }, []);

  useEffect(() => {
    const found = credits.find((c) => c.id === creditId) ?? null;
    setSelectedCredit(found);
    if (found) setValue("amount", found.monthlyPayment);
  }, [creditId, credits, setValue]);

  async function onSubmit(data: PayForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al registrar el pago");
      setSuccess(true);
      reset();
      setSelectedCredit(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">¡Pago registrado!</h2>
          <p className="text-slate-400 text-sm mt-1">Tu pago fue registrado exitosamente.</p>
        </div>
        <Button onClick={() => { setSuccess(false); window.location.reload(); }}>
          Registrar otro pago
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Pagar Cuota</h1>
        <p className="text-slate-400 text-sm mt-1">Registra el pago de tu crédito</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-gold" />
            Datos del pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Credit selector */}
            <div className="space-y-2">
              <Label>Crédito</Label>
              <Select onValueChange={(v) => setValue("creditId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={credits.length === 0 ? "Sin créditos activos" : "Selecciona un crédito"} />
                </SelectTrigger>
                <SelectContent>
                  {credits.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Crédito {c.termMonths} meses · Pendiente {formatCurrency(c.remainingBalance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.creditId && <p className="text-red-400 text-xs">{errors.creditId.message}</p>}
            </div>

            {/* Credit info pill */}
            {selectedCredit && (
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cuota sugerida</span>
                  <span className="text-gold font-semibold">{formatCurrency(selectedCredit.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Saldo pendiente</span>
                  <span className="text-white font-semibold">{formatCurrency(selectedCredit.remainingBalance)}</span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor a pagar (COP)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select defaultValue="TRANSFER" onValueChange={(v) => setValue("method", v as "CASH" | "TRANSFER" | "ONLINE" | "OTHER")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(methodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Número de referencia (opcional)</Label>
              <Input id="reference" placeholder="Ej: 2024-ABC-001" {...register("reference")} />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || credits.length === 0}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</> : "Registrar Pago"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
