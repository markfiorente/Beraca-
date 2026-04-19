"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, PiggyBank, CreditCard, Calculator,
  Banknote, Users, Settings, ChevronRight, ShieldCheck
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

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-navy border-r border-white/5 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold/10 border border-gold/30">
          <span className="text-lg font-display font-bold text-gold">B</span>
        </div>
        <div>
          <span className="font-display font-bold text-xl text-gradient-gold">Beraca</span>
          <p className="text-xs text-slate-500 leading-none mt-0.5">Fondo Familiar</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Mi Cuenta</p>
        {memberNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
              isActive(href)
                ? "bg-gold/15 text-gold border-l-2 border-gold pl-[10px]"
                : "text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
            )}
          >
            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive(href) ? "text-gold" : "text-slate-500 group-hover:text-slate-300")} />
            <span className="flex-1">{label}</span>
            {isActive(href) && <ChevronRight className="h-3 w-3 text-gold" />}
          </Link>
        ))}

        {role === "ADMIN" && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3">Administración</p>
            </div>
            {adminNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  isActive(href)
                    ? "bg-gold/15 text-gold border-l-2 border-gold pl-[10px]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive(href) ? "text-gold" : "text-slate-500 group-hover:text-slate-300")} />
                <span className="flex-1">{label}</span>
                {isActive(href) && <ChevronRight className="h-3 w-3 text-gold" />}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Beraca</p>
      </div>
    </aside>
  );
}
