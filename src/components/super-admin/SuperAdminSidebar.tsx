"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SuperAdminSidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside className="w-64 bg-[#062653] text-[#F4F6F9] font-['Poppins',sans-serif] flex flex-col shrink-0 border-r border-[#031B3A] h-screen sticky top-0 overflow-hidden select-none">
      {/* 1. TOP HEADER (Centré) */}
      <div className="h-16 flex items-center justify-center px-4 bg-[#031B3A] border-b border-[#0D3E82]/40 shrink-0 text-center">
        <h2 className="text-sm sm:text-base font-bold text-white truncate text-center">
          Super-Administrateur
        </h2>
      </div>

      {/* 2. NAVIGATION: Strictly 100% Text-Only (White Theme, No Apricot) */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
            PLATEFORME CENTRALE
          </div>
          <div className="space-y-0.5">
            <Link
              href="/super-admin"
              className={`block px-3 py-2 text-xs transition-colors rounded-lg ${
                isLinkActive("/super-admin")
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Vue d'ensemble
            </Link>
            <Link
              href="/super-admin/organizations"
              className={`block px-3 py-2 text-xs transition-colors rounded-lg ${
                isLinkActive("/super-admin/organizations")
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Entreprises clientes
            </Link>
            <Link
              href="/super-admin/onboarding-requests"
              className={`block px-3 py-2 text-xs transition-colors rounded-lg ${
                isLinkActive("/super-admin/onboarding-requests")
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Demandes d'adhésion en ligne
            </Link>
            <Link
              href="/super-admin/organizations/new"
              className={`block px-3 py-2 text-xs transition-colors rounded-lg ${
                isLinkActive("/super-admin/organizations/new")
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Ajouter une entreprise
            </Link>
          </div>
        </div>

        <div>
          <div className="px-3 pb-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
            ESPACE ENTREPRISE
          </div>
          <div className="space-y-0.5">
            <Link
              href="/admin/dashboard"
              className={`block px-3 py-2 text-xs transition-colors rounded-lg ${
                pathname.startsWith("/admin")
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Accéder au module Entreprise →
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. FIXED BOTTOM FOOTER: Official RKonekte Emblem (reduced & sleek) */}
      <div className="py-2.5 px-3 bg-[#031B3A] border-t border-[#0D3E82]/40 shrink-0 flex flex-col items-center justify-center">
        <img
          src="/logo-rk-emblem.png"
          alt="RKonekte"
          className="h-8 w-auto max-w-[120px] object-contain"
        />
        <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
          Super-Administration
        </span>
      </div>
    </aside>
  );
}
