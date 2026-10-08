"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

interface AdminHeaderProps {
  userName?: string;
  userEmail?: string;
  role?: string;
}

export function AdminHeader({ userName, userEmail, role }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-right">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-800">{userName || "Utilisateur"}</div>
            <div className="text-[11px] text-slate-500">{userEmail || ""}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
