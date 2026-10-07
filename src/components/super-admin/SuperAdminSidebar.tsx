"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, PlusCircle } from "lucide-react";

export function SuperAdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/super-admin",
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/super-admin/organizations",
      label: "Entreprises clientes",
      icon: Building2,
      exact: true,
    },
    {
      href: "/super-admin/organizations/new",
      label: "Nouvelle entreprise",
      icon: PlusCircle,
      exact: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h2 className="text-base font-medium text-white truncate">
          Super Admin
        </h2>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "text-indigo-400 font-semibold bg-slate-800/80"
                  : "text-slate-400 font-medium hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-[11px] text-slate-500 text-center">
          Plateforme Multi-Tenant v1.0
        </div>
      </div>
    </aside>
  );
}
