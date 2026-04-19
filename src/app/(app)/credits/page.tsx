"use client";

import { useEffect, useState } from "react";
import { CreditCard as CreditCardComp } from "@/components/credits/CreditCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Plus } from "lucide-react";
import type { CreditData } from "@/types";

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        setCredits(d.map((c: CreditData & { disbursedAt: string }) => ({
          ...c,
          disbursedAt: new Date(c.disbursedAt),
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  const active = credits.filter((c) => c.status === "ACTIVE");
  const closed = credits.filter((c) => c.status !== "ACTIVE");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Créditos</h1>
          <p className="text-slate-400 text-sm mt-1">Historial y detalle de créditos</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : credits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <CreditCard className="h-12 w-12 opacity-30" />
          <p className="text-sm">No tienes créditos registrados</p>
          <p className="text-xs text-slate-600">Contacta al administrador para solicitar un crédito</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Créditos Activos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((c) => <CreditCardComp key={c.id} credit={c} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Historial</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closed.map((c) => <CreditCardComp key={c.id} credit={c} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
