"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type TxForm = z.infer<typeof transactionSchema>;

interface AccountOption {
  accountId: string; accountNumber: string; memberName: string; balance: number;
}

const typeLabels = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retiro",
  INTEREST: "Interés",
  FEE: "Cargo",
};

export default function AdminTransactionsPage() {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TxForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "DEPOSIT" },
  });

  const accountId = watch("accountId");

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(
          d.members
            .filter((m: { accountNumber?: string | null; savingsBalance: number }) => m.accountNumber)
            .map((m: { savingsBalance: number; accountNumber: string; name: string; id: string }) => ({
              accountId: "",
              accountNumber: m.accountNumber,
              memberName: m.name,
              balance: m.savingsBalance,
              userId: m.id,
            }))
        );
      });
    // Also fetch account IDs
    fetch("/api/admin/members?limit=100")
      .then((r) => r.json())
      .then(async (d) => {
        const opts: AccountOption[] = [];
        for (const m of d.members) {
          if (!m.accountNumber) continue;
          const detail = await fetch(`/api/admin/members/${m.id}`).then(r => r.json());
          if (detail.savingsAccount) {
            opts.push({
              accountId: detail.savingsAccount.id,
              accountNumber: m.accountNumber,
              memberName: m.name,
              balance: m.savingsBalance,
            });
          }
        }
        setAccounts(opts);
      });
  }, []);

  useEffect(() => {
    setSelectedAccount(accounts.find((a) => a.accountId === accountId) ?? null);
  }, [accountId, accounts]);

  async function onSubmit(data: TxForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      setSuccess(true);
      reset();
      setSelectedAccount(null);
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
          <h2 className="text-xl font-bold text-white">¡Transacción registrada!</h2>
          <p className="text-slate-400 text-sm mt-1">La cuenta fue actualizada correctamente.</p>
        </div>
        <Button onClick={() => setSuccess(false)}>Nueva transacción</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Nueva Transacción</h1>
        <p className="text-slate-400 text-sm mt-1">Registrar movimiento en cuenta de ahorros</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-gold" /> Datos de la transacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Miembro / Cuenta</Label>
              <Select onValueChange={(v) => setValue("accountId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={accounts.length === 0 ? "Cargando cuentas..." : "Selecciona un miembro"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.accountId} value={a.accountId}>
                      {a.memberName} · {a.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-red-400 text-xs">{errors.accountId.message}</p>}
            </div>

            {selectedAccount && (
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 text-xs">
                <span className="text-slate-400">Saldo actual: </span>
                <span className="text-gold font-semibold">{formatCurrency(selectedAccount.balance)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select defaultValue="DEPOSIT" onValueChange={(v) => setValue("type", v as "DEPOSIT" | "WITHDRAWAL" | "INTEREST" | "FEE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (COP)</Label>
              <Input id="amount" type="number" placeholder="0" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" placeholder="Aporte mensual Abril 2024" {...register("description")} />
              {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input id="reference" placeholder="Ej: TRF-2024-001" {...register("reference")} />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</> : "Registrar Transacción"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
