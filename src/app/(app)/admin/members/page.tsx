"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Plus, Loader2, Search } from "lucide-react";
import Link from "next/link";

type MemberForm = z.infer<typeof memberSchema>;

interface Member {
  id: string; name: string; email: string; role: string;
  phone?: string | null; memberSince: string; isActive: boolean;
  savingsBalance: number; accountNumber?: string | null; activeCredits: number;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", document: "", role: "MEMBER" as const },
  });

  function load() {
    setLoading(true);
    fetch("/api/admin/members?limit=100")
      .then((r) => r.json())
      .then((d) => setMembers(d.members))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function onCreate(data: MemberForm) {
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      setOpen(false);
      reset();
      load();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Error al crear miembro");
    } finally {
      setCreating(false);
    }
  }

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) ||
           m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Miembros</h1>
          <p className="text-slate-400 text-sm mt-1">{members.length} miembros registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nuevo Miembro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Miembro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Nombre completo</Label>
                  <Input placeholder="María García" {...register("name")} />
                  {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" placeholder="maria@email.com" {...register("email")} />
                  {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Contraseña</Label>
                  <Input type="password" placeholder="••••••" {...register("password")} />
                  {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Teléfono (opcional)</Label>
                  <Input placeholder="300 000 0000" {...register("phone")} />
                </div>
                <div className="space-y-1">
                  <Label>Documento (opcional)</Label>
                  <Input placeholder="CC 1234567890" {...register("document")} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Rol</Label>
                  <Select defaultValue="MEMBER" onValueChange={(v) => setValue("role", v as "ADMIN" | "MEMBER")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Miembro</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : "Crear Miembro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-navy-medium/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cuenta</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Saldo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Créditos</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Miembro desde</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Cargando...</td></tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{m.accountNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gold">{formatCurrency(m.savingsBalance)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={m.activeCredits > 0 ? "warning" : "secondary"}>{m.activeCredits}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={m.isActive ? "success" : "secondary"}>{m.isActive ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(m.memberSince)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`} className="text-xs text-gold hover:text-gold-light transition-colors">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
