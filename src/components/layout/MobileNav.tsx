"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, PiggyBank, CreditCard, Calculator,
  Banknote, Users, Menu, X, ShieldCheck, LogOut
} from "lucide-react";

const memberNav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/savings", label: "Mis Ahorros", icon: PiggyBank },
  { href: "/credits", label: "Mis Créditos", icon: CreditCard },
  { href: "/simulator", label: "Simulador", icon: Calculator },
  { href: "/payments", label: "Pagar Cuota", icon: Banknote },
];

const adminNav = [
  { href: "/admin", label: "Panel Admin", icon: ShieldCheck },
  { href: "/admin/members", label: "Miembros", icon: Users },
  { href: "/admin/transactions", label: "Transacciones", icon: Banknote },
  { href: "/admin/credits", label: "Créditos", icon: CreditCard },
];

interface MobileNavProps {
  role: string;
  userName: string;
}

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-navy border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-gold">B</span>
          </div>
          <span className="font-display font-bold text-lg text-gradient-gold">Beraca</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Overlay + Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-navy border-r border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <span className="font-display font-bold text-gold">B</span>
                </div>
                <span className="font-display font-bold text-xl text-gradient-gold">Beraca</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {memberNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    isActive(href) ? "bg-gold/15 text-gold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {role === "ADMIN" && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3">Admin</p>
                  </div>
                  {adminNav.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        isActive(href) ? "bg-gold/15 text-gold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="px-3 py-4 border-t border-white/5">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full transition-all"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
