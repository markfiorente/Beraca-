"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { computeLoanSummary } from "@/lib/finance";
import Link from "next/link";

type CreditForm = z.infer<typeof creditSchema>;

interface MemberOption { id: string; name: string; email: string; }

export default function NewCreditPage() {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ monthlyPayment: number; totalInterest: number; totalToPay: number } | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreditForm>({
    resolver: zodResolver(creditSchema),
    defaultValues: { termMonths: 12 },
  });

  const amount = watch("principal");
  const term = watch("termMonths");

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then((r) => r.json())
      .then((d) => setMembers(d.members.map((m: { id: string; name: string; email: string }) => ({ id: m.id, name: m.name, email: m.email }))));
  }, []);

  useEffect(() => {
    if (amount > 0 && term > 0) {
      const { monthlyPayment, totalInterest, totalToPay } = computeLoanSummary(amount, term);
      setPreview({ monthlyPayment, totalInterest, totalToPay });
    } else {
      setPreview(null);
    }
  }, [amount, term]);

  async function onSubmit(data: CreditForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear crédito");
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
          <h2 className="text-xl font-bold text-white">¡Crédito creado!</h2>
          <p className="text-slate-400 text-sm mt-1">El crédito fue registrado y la tabla de amortización fue generada.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/credits"><Button variant="outline">Ver créditos</Button></Link>
          <Button onClick={() => setSuccess(false)}>Crear otro</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Nuevo Crédito</h1>
        <p className="text-slate-400 text-sm mt-1">Tasa fija 1% efectivo mensual</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gold" /> Datos del crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Miembro beneficiario</Label>
              <Select onValueChange={(v) => setValue("userId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un miembro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} · {m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-red-400 text-xs">{errors.userId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="principal">Monto (COP)</Label>
                <Input id="principal" type="number" placeholder="1,000,000" {...register("principal", { valueAsNumber: true })} />
                {errors.principal && <p className="text-red-400 text-xs">{errors.principal.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="termMonths">Plazo (meses)</Label>
                <Input id="termMonths" type="number" min={1} max={120} {...register("termMonths", { valueAsNumber: true })} />
                {errors.termMonths && <p className="text-red-400 text-xs">{errors.termMonths.message}</p>}
              </div>
            </div>

            {preview && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cuota mensual", value: formatCurrency(preview.monthlyPayment), color: "text-gold" },
                  { label: "Total intereses", value: formatCurrency(preview.totalInterest), color: "text-amber-400" },
                  { label: "Total a pagar", value: formatCurrency(preview.totalToPay), color: "text-white" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" placeholder="Observaciones del crédito..." {...register("notes")} />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : "Crear Crédito"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
