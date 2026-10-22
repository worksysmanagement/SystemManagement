"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  TrendingUp,
  FileSignature,
  Building,
  CheckCircle2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  category:
    | "LEAVE"
    | "SALARY_RAISE"
    | "SIGNATURE"
    | "SYSTEM"
    | "ADMIN_ANNOUNCEMENT"
    | "HR_DECISION";
  title: string;
  description: string;
  timestamp: string;
  link: string;
  unread: boolean;
  meta?: string;
}

type FilterTab =
  | "ALL"
  | "UNREAD"
  | "LEAVE"
  | "SALARY_RAISE"
  | "SIGNATURE"
  | "ADMIN_ANNOUNCEMENT"
  | "HR_DECISION";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        setLoading(true);

        // 1. Détection du rôle de l'utilisateur connecté
        const meRes = await fetch("/api/auth/me");
        let role = "EMPLOYEE";
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user?.role) {
            role = meData.user.role;
          }
        }
        if (!isMounted) return;
        setCurrentUserRole(role);

        const isEmp =
          role === "EMPLOYEE" ||
          role.toLowerCase().includes("employ") ||
          role.toLowerCase().includes("collab") ||
          role.toLowerCase().includes("operat");

        // 2. Pour les employés : le flux représente les alertes venant de l'administration.
        // Conformément aux consignes : aucune alerte pour l'instant (0 alerte).
        if (isEmp) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        // 3. Pour l'administration : affichage des demandes soumises par les employés
        const res = await fetch("/api/admin/requests?limit=50");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.requests && Array.isArray(data.requests)) {
            const mapped: NotificationItem[] = data.requests.map((r: any) => ({
              id: r.id,
              category: "LEAVE",
              title: `Demande de congé — ${r.employeeName || "Employé"}`,
              description: `Demande de type ${r.leaveType || "Congé"} (${r.daysRequested || 0} jour(s)) soumise le ${r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "récemment"}. Statut : ${r.status || "En attente"}.`,
              timestamp: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "Récemment",
              link: "/admin/requests",
              unread: r.status === "PENDING",
              meta: `${r.requestNumber || r.id} • ${r.department || "Non renseigné"}`,
            }));
            setNotifications(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load notifications:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const isEmployee =
    currentUserRole === "EMPLOYEE" ||
    currentUserRole?.toLowerCase().includes("employ") ||
    currentUserRole?.toLowerCase().includes("collab") ||
    currentUserRole?.toLowerCase().includes("operat");

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const filteredNotifications = useMemo(() => {
    if (isEmployee) {
      return notifications;
    }
    return notifications.filter((n) => {
      // Tab filter
      if (filterTab === "UNREAD" && !n.unread) return false;
      if (filterTab === "LEAVE" && n.category !== "LEAVE") return false;
      if (filterTab === "SALARY_RAISE" && n.category !== "SALARY_RAISE") return false;
      if (filterTab === "SIGNATURE" && n.category !== "SIGNATURE") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          (n.meta && n.meta.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [notifications, filterTab, searchQuery, isEmployee]);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
              {isEmployee ? "Alertes Administratives" : "Centre d'Alertes"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
            Centre de Notifications
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isEmployee
              ? "Alertes officielles, communications institutionnelles et décisions transmises par la Direction et l'Administration."
              : "Suivi en temps réel des demandes de congé, des arbitrages salariaux et des autorisations de signature."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white hover:bg-[#F4F6F9] text-[#062653] border border-[#DCE2EA] text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#FF7900]" />
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </div>

      {/* 2. TABS & SEARCH (Administrateur uniquement) */}
      {!isEmployee && (
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* TAB BUTTONS */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTab("ALL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterTab === "ALL"
                    ? "bg-[#062653] text-white"
                    : "bg-[#F4F6F9] text-[#64748B] hover:text-[#062653]"
                }`}
              >
                Toutes ({notifications.length})
              </button>

              <button
                onClick={() => setFilterTab("UNREAD")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterTab === "UNREAD"
                    ? "bg-[#062653] text-white"
                    : "bg-[#F4F6F9] text-[#64748B] hover:text-[#062653]"
                }`}
              >
                Non lues
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#FF7900]" />
                )}
              </button>

              <button
                onClick={() => setFilterTab("LEAVE")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterTab === "LEAVE"
                    ? "bg-[#062653] text-white"
                    : "bg-[#F4F6F9] text-[#64748B] hover:text-[#062653]"
                }`}
              >
                Congés
              </button>

              <button
                onClick={() => setFilterTab("SALARY_RAISE")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterTab === "SALARY_RAISE"
                    ? "bg-[#062653] text-white"
                    : "bg-[#F4F6F9] text-[#64748B] hover:text-[#062653]"
                }`}
              >
                Augmentations
              </button>

              <button
                onClick={() => setFilterTab("SIGNATURE")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterTab === "SIGNATURE"
                    ? "bg-[#062653] text-white"
                    : "bg-[#F4F6F9] text-[#64748B] hover:text-[#062653]"
                }`}
              >
                Signatures
              </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Rechercher une notification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder-[#64748B] focus:bg-white transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DCE2EA] p-12 text-center space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <div className="w-6 h-6 border-2 border-[#FF7900] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#64748B]">Chargement des alertes...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#FFF4EB] text-[#FF7900] flex items-center justify-center mx-auto mb-1">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#062653]">
                    {isEmployee
                      ? "Aucune alerte administrative pour le moment"
                      : "Aucune notification pour le moment"}
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto">
                    {isEmployee
                      ? "Votre flux administratif est parfaitement à jour. Les communications, notes de service et alertes transmises par la Direction apparaîtront ici."
                      : "Votre flux est à jour. Aucune nouvelle demande ne requiert votre attention."}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.unread
                  ? "bg-white border-[#FF7900]/40 shadow-xs"
                  : "bg-white/80 border-[#DCE2EA] opacity-90 hover:opacity-100"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* UNREAD INDICATOR */}
                <div className="pt-1 shrink-0">
                  {n.unread ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7900] block ring-4 ring-[#FFF4EB]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        n.category === "LEAVE"
                          ? "bg-[#062653] text-white"
                          : n.category === "SALARY_RAISE"
                          ? "bg-[#FFF4EB] text-[#FF7900] border border-[#FF7900]/30"
                          : n.category === "SIGNATURE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : n.category === "ADMIN_ANNOUNCEMENT"
                          ? "bg-[#062653] text-[#FF7900] border border-[#FF7900]/30"
                          : n.category === "HR_DECISION"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "bg-[#F4F6F9] text-[#263445]"
                      }`}
                    >
                      {n.category === "LEAVE"
                        ? "Congé"
                        : n.category === "SALARY_RAISE"
                        ? "Augmentation"
                        : n.category === "SIGNATURE"
                        ? "Signature d'autorisation"
                        : n.category === "ADMIN_ANNOUNCEMENT"
                        ? "Communication officielle"
                        : n.category === "HR_DECISION"
                        ? "Décision RH"
                        : "Système"}
                    </span>
                    <h3 className="text-xs font-bold text-[#062653]">{n.title}</h3>
                    <span className="text-[11px] text-[#64748B]">• {n.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#263445] font-medium leading-relaxed">
                    {n.description}
                  </p>

                  {n.meta && (
                    <div className="text-[11px] text-[#64748B] font-mono">
                      {n.meta}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION LINKS */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.unread && (
                  <button
                    onClick={() => markSingleAsRead(n.id)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-[#64748B] hover:text-[#062653] hover:bg-[#F4F6F9] rounded-lg transition-colors cursor-pointer"
                  >
                    Marquer lu
                  </button>
                )}

                <Link
                  href={n.link}
                  onClick={() => markSingleAsRead(n.id)}
                  className="px-3.5 py-1.5 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 border-b-2 border-[#FF7900]"
                >
                  <span>Consulter</span>
                  <ExternalLink className="w-3 h-3 text-[#FF7900]" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
