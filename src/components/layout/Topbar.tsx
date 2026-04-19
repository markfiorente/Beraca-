"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { LogOut, User, ChevronDown } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  userName: string;
  userRole: string;
  title?: string;
}

export function Topbar({ userName, userRole, title }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-navy-light/50 backdrop-blur-sm flex-shrink-0">
      <div>
        {title && <h1 className="text-base font-semibold text-white">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        {userRole === "ADMIN" && (
          <span className="hidden sm:flex items-center gap-1 text-xs bg-gold/10 text-gold border border-gold/20 rounded-full px-2.5 py-1">
            Administrador
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">{userName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-slate-300 font-normal">{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
