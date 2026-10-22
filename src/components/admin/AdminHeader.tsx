"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Bell, Check, ExternalLink, ChevronDown } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useSidebar, MenuDotsIcon, CloseTicksIcon } from "./SidebarContext";

interface AdminHeaderProps {
  userName?: string;
  userEmail?: string;
  role?: string;
  organizationName?: string;
}

interface HeaderBranch {
  id: string;
  name: string;
  city: string;
  code?: string;
}

export function AdminHeader({ userName, userEmail, role, organizationName }: AdminHeaderProps) {
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [availableBranches, setAvailableBranches] = useState<HeaderBranch[]>([
    { id: "all", name: "Toutes les succursales", city: "Consolidé" },
  ]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch dynamic branches from organization
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/api/admin/branches");
        if (res.ok) {
          const data = await res.json();
          if (data.branches && Array.isArray(data.branches) && data.branches.length > 0) {
            const list: HeaderBranch[] = [
              { id: "all", name: "Toutes les succursales", city: "Consolidé" },
              ...data.branches.map((b: any) => ({
                id: b.id,
                name: b.name,
                city: b.city,
                code: b.code,
              })),
            ];
            setAvailableBranches(list);

            // Restore saved branch or default to all
            const saved = typeof window !== "undefined" ? localStorage.getItem("rk_active_branch") : null;
            if (saved && list.some((b) => b.id === saved)) {
              setSelectedBranch(saved);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load header branches:", err);
      }
    }
    loadBranches();
  }, []);

  const handleSelectBranch = (bId: string) => {
    setSelectedBranch(bId);
    setIsBranchOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("rk_active_branch", bId);
      document.cookie = `rk_active_branch=${encodeURIComponent(bId)}; path=/; max-age=31536000`;
      window.dispatchEvent(new CustomEvent("branchChange", { detail: { branchId: bId } }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBranch =
    availableBranches.find((b) => b.id === selectedBranch) ||
    availableBranches[0];

  interface HeaderNotification {
    id: string;
    title: string;
    time: string;
    type: string;
    link: string;
    unread: boolean;
  }

  // Real dynamic notifications (empty when no pending alerts in the system)
  const [notificationsList, setNotificationsList] = useState<HeaderNotification[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchPendingNotifications() {
      const isEmployeeRole =
        role === "EMPLOYEE" ||
        role?.toLowerCase().includes("employ") ||
        role?.toLowerCase().includes("collab") ||
        role?.toLowerCase().includes("operat");

      if (isEmployeeRole) {
        if (isMounted) setNotificationsList([]);
        return;
      }

      try {
        const res = await fetch("/api/admin/requests?status=PENDING&limit=5");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.requests && Array.isArray(data.requests)) {
            const mapped: HeaderNotification[] = data.requests.map((r: any) => ({
              id: r.id,
              title: `Demande de congé — ${r.employeeName || "Employé"}`,
              time: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "Récent",
              type: r.leaveType || "Congé",
              link: "/admin/requests",
              unread: true,
            }));
            setNotificationsList(mapped);
          }
        }
      } catch (err) {
        console.warn("Notifications fetch error:", err);
      }
    }
    fetchPendingNotifications();
    return () => {
      isMounted = false;
    };
  }, [role]);

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="h-16 bg-white border-b border-[#DCE2EA] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* 1. LEFT SECTION: Sidebar Toggle Button, System Title & Active Branch Selector */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Sidebar Toggle Button (Menu 4-dots / Close 4-ticks + Ctrl+B) */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? "Ouvrir la barre latérale (Ctrl+B)" : "Fermer la barre latérale (Ctrl+B)"}
          aria-label={isCollapsed ? "Ouvrir la barre latérale" : "Fermer la barre latérale"}
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full bg-[#F4F6F9] hover:bg-slate-200/80 border border-[#DCE2EA] text-[#263445] transition-all shadow-2xs hover:shadow-xs active:scale-95 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-200/80 text-[#062653] group-hover:text-[#FF7900] transition-colors shrink-0">
            {isCollapsed ? (
              <MenuDotsIcon className="w-3.5 h-3.5" />
            ) : (
              <CloseTicksIcon className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs font-bold text-[#062653] hidden sm:inline">
            {isCollapsed ? "Menu" : "Fermer"}
          </span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs">
            Ctrl B
          </kbd>
        </button>


        {/* Branch Selector Custom Dropdown */}
        <div className="relative flex items-center gap-2" ref={branchRef}>
          <span className="text-xs font-semibold text-[#64748B] hidden md:inline">
            Succursale :
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className={`h-9 px-3 bg-[#F4F6F9] hover:bg-slate-100 border rounded-xl text-xs font-semibold text-[#062653] flex items-center gap-2 transition-all cursor-pointer ${
                isBranchOpen ? "border-[#062653] ring-1 ring-[#062653]/30" : "border-[#DCE2EA]"
              }`}
            >
              <span>{currentBranch.name} ({currentBranch.city})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isBranchOpen ? "rotate-180" : ""}`} />
            </button>

            {isBranchOpen && (
              <div
                role="listbox"
                className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-[#DCE2EA] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 overflow-hidden"
              >
                {availableBranches.map((b) => {
                  const isSelected = selectedBranch === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectBranch(b.id)}
                      className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#062653] text-white font-bold"
                          : "text-[#263445] hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{b.name}</span>
                        <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-[#64748B]"}`}>
                          {b.city}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT SECTION: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#64748B] hover:text-[#062653] hover:bg-[#F4F6F9] rounded-lg transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7900] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#DCE2EA] p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
                <div className="text-xs font-bold text-[#062653]">
                  Notifications {unreadCount > 0 ? `(${unreadCount} non lue${unreadCount > 1 ? "s" : ""})` : "(0)"}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#FF7900] hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {notificationsList.length === 0 ? (
                  <div className="py-7 px-3 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-[#F4F6F9] flex items-center justify-center text-[#64748B] mb-2.5">
                      <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-[#062653]">Aucune notification</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Toutes vos alertes sont à jour.</p>
                  </div>
                ) : (
                  notificationsList.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setShowNotifications(false)}
                      className={`block p-2.5 rounded-lg border transition-colors ${
                        n.unread
                          ? "bg-[#FFF4EB] border-[#FF7900]/30 hover:bg-[#FFEADA]"
                          : "bg-[#F4F6F9] border-transparent hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#263445]">{n.title}</span>
                        <span className="text-[10px] text-[#64748B]">{n.time}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center justify-between">
                        <span>Type : {n.type}</span>
                        <span className="text-[10px] font-semibold text-[#FF7900] flex items-center gap-1">
                          Consulter <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#DCE2EA] text-center">
                <Link
                  href="/admin/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#062653] hover:text-[#FF7900] transition-colors"
                >
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#DCE2EA]">
          <Link
            href="/admin/configuration?tab=profile"
            className="text-right hidden sm:block group cursor-pointer"
            title="Consulter et compléter mon dossier personnel"
          >
            <div className="text-xs font-bold text-[#263445] group-hover:text-[#FF7900] transition-colors leading-none">
              {userName || "Collaborateur"}
            </div>
            <div className="text-[11px] text-[#64748B] group-hover:text-[#263445] transition-colors mt-1">
              {userEmail || ""}
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
