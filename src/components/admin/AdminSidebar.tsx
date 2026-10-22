"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Shield,
  CircleHelp,
  Mail,
  Copy,
  Check,
  ExternalLink,
  X,
  Calendar,
  Users,
  Settings,
  FileSignature,
  User,
  Lock,
  Bell,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { ModuleKey, TabPermission } from "@/lib/types/roles";

interface AdminSidebarProps {
  role?: "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "SECRETARY" | "FINANCIAL_MANAGER" | "BRANCH_MANAGER" | "EMPLOYEE" | string;
  organizationName?: string;
}

export function AdminSidebar({ role, organizationName }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();

  // Helper to check active state including query params when present
  const isLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      if (pathname !== path) return false;
      const targetParams = new URLSearchParams(query);
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }

    if (href === "/admin/requests") {
      return (
        pathname === "/admin/requests" ||
        (pathname.startsWith("/admin/requests/") &&
          !pathname.startsWith("/admin/requests/signature-auth"))
      );
    }

    return (
      pathname === href ||
      (pathname.startsWith(href + "/") && href !== "/admin" && href !== "/super-admin")
    );
  };

  // Dynamic permissions from DB
  const [permissions, setPermissions] = useState<Record<ModuleKey, TabPermission> | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/my-permissions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.permissions) {
          setPermissions(data.permissions);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Role flags
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isOrgAdmin = role === "ORGANIZATION_ADMIN" || (!role && !permissions) || isSuperAdmin;
  const isSecretary = role === "SECRETARY";
  const isFinancial = role === "FINANCIAL_MANAGER";
  const isBranch = role === "BRANCH_MANAGER";
  const isEmployee =
    role === "EMPLOYEE" ||
    role === "COLLABORATEUR" ||
    (typeof role === "string" &&
      (role.toLowerCase().includes("employ") || role.toLowerCase().includes("collab")));

  // Permission rules per module (governed dynamically by admin via DB, with strict defaults)
  const canSeeSuperAdmin = isSuperAdmin;
  const canSeeDashboard = permissions?.dashboard
    ? permissions.dashboard.view
    : isEmployee
    ? false
    : true;

  // Requests: By default visible for employee (Congé, Signature d'autorisation)
  const canSeeLeaves = permissions?.requests
    ? permissions.requests.view
    : isSuperAdmin || isOrgAdmin || isSecretary || isBranch || isEmployee;
  const canSeeSignatureAuth = permissions?.requests
    ? permissions.requests.view
    : isSuperAdmin || isOrgAdmin || isSecretary || isFinancial || isEmployee;
  const canSeeRequestsSection = canSeeLeaves || canSeeSignatureAuth;

  // Employees: Hidden by default for employee
  const canSeeEmployeesList = permissions?.employees
    ? permissions.employees.view
    : isSuperAdmin || isOrgAdmin || isSecretary || isFinancial || isBranch;
  const canSeeNewEmployee = permissions?.employees
    ? permissions.employees.create
    : isSuperAdmin || isOrgAdmin || isSecretary;
  const canSeeEmployeesSection = permissions?.employees
    ? permissions.employees.view
    : canSeeEmployeesList || canSeeNewEmployee;

  // Branches: Hidden by default for employee
  const canSeeBranchesList = permissions?.branches
    ? permissions.branches.view
    : isSuperAdmin || isOrgAdmin || isBranch;
  const canSeeNewBranch = permissions?.branches
    ? permissions.branches.create
    : isSuperAdmin || isOrgAdmin;
  const canSeeBranchesSection = permissions?.branches
    ? permissions.branches.view
    : isSuperAdmin || isOrgAdmin || isBranch;

  // Financial Operations: Hidden by default for employee
  const canSeeFinances = permissions?.financial_ops
    ? permissions.financial_ops.view
    : isSuperAdmin || isOrgAdmin || isFinancial;

  // Financial Reports: Hidden by default for employee
  const canSeeReports = permissions?.financial_reports
    ? permissions.financial_reports.view
    : isSuperAdmin || isOrgAdmin || isFinancial;

  // Events: Visible by default for employee
  const canSeeEvents = permissions?.events ? permissions.events.view : true;

  // Espace Client
  const canSeeCustomerSpace = permissions?.customer_space
    ? permissions.customer_space.view
    : isSuperAdmin || isOrgAdmin || isSecretary || isBranch;

  // Access Management: Hidden by default for employee
  const canSeeAccess = permissions?.users ? permissions.users.view : isSuperAdmin || isOrgAdmin;

  // Système: Centre de notifications (visible by default)
  const canSeeNotifications = permissions?.notifications
    ? permissions.notifications.view
    : true;

  // Système: Configurations
  const canSeeConfig = permissions?.configuration
    ? permissions.configuration.view
    : isSuperAdmin || isOrgAdmin || isEmployee;

  // Active state flags
  const isDashboardActive = isLinkActive("/admin/dashboard");
  const isRequestsActive = pathname.startsWith("/admin/requests");
  const isEmployeesActive = pathname.startsWith("/admin/employees");
  const isBranchesActive = pathname.startsWith("/admin/branches");
  const isFinancesActive = pathname.startsWith("/admin/financial-operations");
  const isReportsActive = pathname.startsWith("/admin/financial-reports");
  const isEventsActive = pathname.startsWith("/admin/events");
  const isCustomerSpaceActive = pathname.startsWith("/admin/espace-client");
  const isAccessActive = pathname.startsWith("/admin/users");
  const isConfigActive = pathname.startsWith("/admin/configuration");
  const isGeneralPrefActive = pathname === "/admin/configuration";
  const isSignatureActive = pathname.startsWith("/admin/configuration/signature");
  const isProfileActive = pathname.startsWith("/admin/configuration/profile");
  const isSecurityActive = pathname.startsWith("/admin/configuration/security");
  const isNotificationsSettingsActive = pathname.startsWith("/admin/configuration/notifications");
  const isSupportActive = pathname.startsWith("/admin/support");
  const isSuperAdminActive = pathname.startsWith("/super-admin");

  // Accordion open/close state: strictly ONE menu open at a time
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (isRequestsActive) initial.requete = true;
    else if (isEmployeesActive) initial.employes = true;
    else if (isBranchesActive) initial.succursales = true;
    else if (isFinancesActive) initial.finances = true;
    else if (isReportsActive) initial.reports = true;
    else if (isAccessActive) initial.acces = true;
    else if (isConfigActive) initial.config = true;
    else if (isSuperAdminActive) initial.superAdmin = true;
    return initial;
  });

  // Keep ONLY the active section open when route changes (closes all others)
  useEffect(() => {
    if (isRequestsActive) setOpenMenus({ requete: true });
    else if (isEmployeesActive) setOpenMenus({ employes: true });
    else if (isBranchesActive) setOpenMenus({ succursales: true });
    else if (isFinancesActive) setOpenMenus({ finances: true });
    else if (isReportsActive) setOpenMenus({ reports: true });
    else if (isAccessActive) setOpenMenus({ acces: true });
    else if (isConfigActive) setOpenMenus({ config: true });
    else if (isSuperAdminActive) setOpenMenus({ superAdmin: true });
    else setOpenMenus({});
  }, [pathname]);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const isCurrentlyOpen = Boolean(prev[key]);
      // If clicking on the currently open menu, collapse it
      if (isCurrentlyOpen) {
        return {};
      }
      // Otherwise, open ONLY the clicked menu (closes any other open menu)
      return { [key]: true };
    });
  };

  // Support Modal state & mail connection
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSupportOpen(false);
    };
    if (isSupportOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isSupportOpen]);

  const supportEmail = "rkonekte509@gmail.com";
  const mailtoSubject = encodeURIComponent(
    `Demande de Support — ${organizationName || "Entreprise"}`
  );
  const mailtoBody = encodeURIComponent(
    `Bonjour l'équipe support RKonekte,\n\nEntreprise : ${organizationName || "Entreprise"}\n\nDescription de ma demande :\n`
  );
  const mailtoUrl = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${mailtoSubject}&body=${mailtoBody}`;

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <aside
      className={`bg-[#062653] text-[#F4F6F9] font-['Poppins',sans-serif] flex flex-col shrink-0 border-r border-[#031B3A] h-screen sticky top-0 overflow-hidden select-none transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-64 sm:w-[270px]"
      }`}
    >
      {/* 1. TOP HEADER */}
      <div className="h-16 flex items-center justify-center px-3 bg-[#031B3A] border-b border-[#0D3E82]/40 shrink-0 text-center">
        {isCollapsed ? (
          <div
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-extrabold text-sm select-none shadow-xs"
            title={organizationName || "Entreprise"}
          >
            {(organizationName || "R").charAt(0).toUpperCase()}
          </div>
        ) : (
          <h2
            className="text-sm sm:text-base font-bold text-white truncate text-center"
            title={organizationName || (isSuperAdmin ? "Super Administration" : "Entreprise")}
          >
            {organizationName || (isSuperAdmin ? "Super Administration" : "Entreprise Connectée")}
          </h2>
        )}
      </div>

      {/* 2. NAVIGATION */}
      {isCollapsed ? (
        /* COLLAPSED ICON-ONLY RAIL (Only icons remain, centered, with tooltips) */
        <nav className="flex-1 px-2.5 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {/* SUPER-ADMIN */}
          {canSeeSuperAdmin && (
            <Link
              href="/super-admin"
              title="Super-Administration"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isSuperAdminActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Shield className="w-5 h-5 text-white shrink-0" />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Super-Administration
              </div>
            </Link>
          )}

          {/* TABLEAU DE BORD */}
          {canSeeDashboard && (
            <Link
              href="/admin/dashboard"
              title="Tableau de Bord"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isDashboardActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/dashboard.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Tableau de Bord
              </div>
            </Link>
          )}

          {/* REQUETE */}
          {canSeeRequestsSection && (
            <Link
              href="/admin/requests"
              title="Requete"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isRequestsActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/requests.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Requete
              </div>
            </Link>
          )}

          {/* EMPLOYÉS */}
          {canSeeEmployeesSection && (
            <Link
              href="/admin/employees"
              title="Employés"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isEmployeesActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/employees.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Employés
              </div>
            </Link>
          )}

          {/* SUCCURSALES */}
          {canSeeBranchesSection && (
            <Link
              href="/admin/branches"
              title="Succursales"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isBranchesActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/branches.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Succursales
              </div>
            </Link>
          )}

          {/* OPÉRATIONS FINANCIÈRES */}
          {canSeeFinances && (
            <Link
              href="/admin/financial-operations"
              title="Opérations Financieres"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isFinancesActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/financial-ops.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Opérations Financieres
              </div>
            </Link>
          )}

          {/* RAPPORTS FINANCIERS */}
          {canSeeReports && (
            <Link
              href="/admin/financial-reports"
              title="Rapports Financiers"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isReportsActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/financial-reports.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Rapports Financiers
              </div>
            </Link>
          )}

          {/* ÉVÉNEMENTS */}
          {canSeeEvents && (
            <Link
              href="/admin/events"
              title="Événements"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isEventsActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/calendar-white.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Événements
              </div>
            </Link>
          )}

          {/* ESPACE CLIENT */}
          {canSeeCustomerSpace && (
            <Link
              href="/admin/espace-client"
              title="Espace Client"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isCustomerSpaceActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Users className="w-5 h-5 shrink-0 text-white" />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Espace Client
              </div>
            </Link>
          )}

          {/* GESTIONS DES ACCÈS */}
          {canSeeAccess && (
            <Link
              href="/admin/users"
              title="Gestions des accès"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isAccessActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/access.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Gestions des accès
              </div>
            </Link>
          )}

          {/* Spacer */}
          <div className="my-2" />

          {/* CENTRE DE NOTIFICATIONS */}
          {canSeeNotifications && (
            <Link
              href="/admin/notifications"
              title="Centre de notifications"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isLinkActive("/admin/notifications")
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/notifications.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Centre de notifications
              </div>
            </Link>
          )}

          {/* CONFIGURATIONS */}
          {canSeeConfig && (
            <Link
              href={isEmployee ? "/admin/configuration/profile" : "/admin/configuration"}
              title="Configurations"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
                isConfigActive
                  ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <img
                src="/icons/sidebar/config.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
                Configurations
              </div>
            </Link>
          )}

          {/* SUPPORT */}
          <Link
            href="/admin/support"
            title="Support & Manuel d'Utilisation"
            className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 relative group cursor-pointer ${
              isSupportActive
                ? "bg-white/15 text-white font-bold ring-1 ring-white/20 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <CircleHelp className="w-5 h-5 shrink-0" />
            <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none items-center">
              Support & Manuel
            </div>
          </Link>
        </nav>
      ) : (
        /* 2. NAVIGATION: Menus Déroulants avec Sous-Onglets (100% White Theme, No Apricot) */
        <nav className="flex-1 px-3.5 py-4 space-y-3 overflow-y-auto">
        {/* SECTION 1: VUE D'ENSEMBLE (du haut jusqu'à Gestion des accès inclues) */}
        <div className="px-3.5 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
          Vue d'ensemble
        </div>

        {/* SUPER-ADMINISTRATION (Visible pour SUPER_ADMIN) */}
        {canSeeSuperAdmin && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("superAdmin")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isSuperAdminActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Shield className="w-5 h-5 text-white shrink-0" />
                <span className="truncate">Super-Administration</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.superAdmin ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.superAdmin && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                <Link
                  href="/super-admin"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    pathname === "/super-admin"
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Vue d'ensemble
                </Link>
                <Link
                  href="/super-admin/organizations"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/super-admin/organizations") && !pathname.includes("/new")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Entreprises clientes
                </Link>
                <Link
                  href="/super-admin/onboarding-requests"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/super-admin/onboarding-requests")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Demandes d'adhésion en ligne
                </Link>
                <Link
                  href="/super-admin/organizations/new"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/super-admin/organizations/new")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Ajouter une entreprise
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 1. TABLEAU DE BORD (Lien direct sans sous-menu) */}
        {canSeeDashboard && (
          <div>
            <Link
              href="/admin/dashboard"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isDashboardActive ? "bg-white/10 font-bold" : "text-slate-300 hover:text-white"
              }`}
            >
              <img
                src="/icons/sidebar/dashboard.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="truncate">Tableau de Bord</span>
            </Link>
          </div>
        )}

        {/* 2. REQUETE */}
        {canSeeRequestsSection && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("requete")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isRequestsActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/requests.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Requete</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.requete ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.requete && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                {canSeeLeaves && (
                  <Link
                    href="/admin/requests"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/requests")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Congé
                  </Link>
                )}
                {canSeeSignatureAuth && (
                  <Link
                    href="/admin/requests/signature-auth"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/requests/signature-auth")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Signature d'autorisation
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. EMPLOYÉS */}
        {canSeeEmployeesSection && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("employes")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isEmployeesActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/employees.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Employés</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.employes ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.employes && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                {canSeeEmployeesList && (
                  <Link
                    href="/admin/employees"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/employees") && !pathname.includes("/new")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Liste des employés
                  </Link>
                )}
                {canSeeNewEmployee && (
                  <Link
                    href="/admin/employees/new"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/employees/new")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Nouvel employé
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. SUCCURSALES */}
        {canSeeBranchesSection && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("succursales")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isBranchesActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/branches.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Succursales</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.succursales ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.succursales && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                {canSeeBranchesList && (
                  <Link
                    href="/admin/branches"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/branches") && !pathname.includes("/new")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Liste des succursales
                  </Link>
                )}
                {canSeeNewBranch && (
                  <Link
                    href="/admin/branches/new"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      isLinkActive("/admin/branches/new")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Nouvelle succursale
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. OPÉRATIONS FINANCIÈRES */}
        {canSeeFinances && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("finances")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isFinancesActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/financial-ops.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Opérations Financieres</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.finances ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.finances && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                <Link
                  href="/admin/financial-operations?tab=deposits"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-operations?tab=deposits")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Dépôts bancaires
                </Link>
                <Link
                  href="/admin/financial-operations?tab=withdrawals"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-operations?tab=withdrawals")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Retraits bancaires
                </Link>
                <Link
                  href="/admin/financial-operations?tab=expenses"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-operations?tab=expenses")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Dépenses
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 6. RAPPORTS FINANCIERS */}
        {canSeeReports && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("reports")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isReportsActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/financial-reports.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Rapports Financiers</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.reports ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.reports && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                <Link
                  href="/admin/financial-reports?period=daily"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-reports?period=daily")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rapport journalier
                </Link>
                <Link
                  href="/admin/financial-reports?period=weekly"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-reports?period=weekly")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rapport hebdomadaire
                </Link>
                <Link
                  href="/admin/financial-reports?period=monthly"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-reports?period=monthly")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rapport mensuel
                </Link>
                <Link
                  href="/admin/financial-reports?period=yearly"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isLinkActive("/admin/financial-reports?period=yearly")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rapport annuel
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ÉVÉNEMENTS */}
        {canSeeEvents && (
          <div>
            <Link
              href="/admin/events"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isEventsActive
                  ? "bg-white/10 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <img
                src="/icons/sidebar/calendar-white.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="truncate">Événements</span>
            </Link>
          </div>
        )}

        {/* ESPACE CLIENT */}
        {canSeeCustomerSpace && (
          <div>
            <Link
              href="/admin/espace-client"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isCustomerSpaceActive
                  ? "bg-white/10 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5 shrink-0 text-white" />
              <span className="truncate">Espace Client</span>
            </Link>
          </div>
        )}

        {/* 7. GESTION DES ACCÈS */}
        {canSeeAccess && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("acces")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isAccessActive ? "bg-white/10 font-bold" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <img
                  src="/icons/sidebar/access.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Gestions des accès</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                  openMenus.acces ? "rotate-180" : ""
                }`}
              />
            </button>
            {openMenus.acces && (
              <div className="mt-1.5 ml-4 pl-3 space-y-1">
                <Link
                  href="/admin/users"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    pathname === "/admin/users"
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Liste des utilisateurs
                </Link>
                <Link
                  href="/admin/users/roles"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    pathname.startsWith("/admin/users/roles")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rôles & Permissions
                </Link>
                <Link
                  href="/admin/users/signatures"
                  className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    pathname.startsWith("/admin/users/signatures")
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Droits de signature
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: SYSTÈME (Notifications, Configurations, Support) */}
        <div className="pt-2 mt-4 space-y-3">
          <div className="px-3.5 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
            Système
          </div>

          {/* NOTIFICATIONS */}
          {canSeeNotifications && (
            <div>
              <Link
                href="/admin/notifications"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                  isLinkActive("/admin/notifications")
                    ? "bg-white/10 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <img
                  src="/icons/sidebar/notifications.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="truncate">Centre de notifications</span>
              </Link>
            </div>
          )}

          {/* CONFIGURATIONS AVEC SOUS-ONGLETS */}
          {canSeeConfig && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu("config")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                  isConfigActive ? "bg-white/10 font-bold" : "bg-transparent"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src="/icons/sidebar/config.png"
                    alt=""
                    aria-hidden="true"
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  <span className="truncate">Configurations</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ml-1.5 ${
                    openMenus.config ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openMenus.config && (
                <div className="mt-1.5 ml-4 pl-3 space-y-1">
                  {!isEmployee && (
                    <Link
                      href="/admin/configuration"
                      className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                        pathname === "/admin/configuration"
                          ? "bg-white/15 text-white font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Préférences générales
                    </Link>
                  )}
                  {!isEmployee && (
                    <Link
                      href="/admin/configuration/signature"
                      className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                        pathname.startsWith("/admin/configuration/signature")
                          ? "bg-white/15 text-white font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Création de signature
                    </Link>
                  )}
                  <Link
                    href="/admin/configuration/profile"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      pathname.startsWith("/admin/configuration/profile")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Mon dossier personnel
                  </Link>
                  <Link
                    href="/admin/configuration/security"
                    className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      pathname.startsWith("/admin/configuration/security")
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Sécurité du compte
                  </Link>
                  {!isEmployee && (
                    <Link
                      href="/admin/configuration/notifications"
                      className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                        pathname.startsWith("/admin/configuration/notifications")
                          ? "bg-white/15 text-white font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Paramètres de notification
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUPPORT */}
          <div>
            <Link
              href="/admin/support"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-lg transition-colors text-white hover:bg-white/10 ${
                isSupportActive
                  ? "bg-white/10 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Centre d'Aide & Manuel d'Utilisation"
            >
              <CircleHelp className="w-5 h-5 shrink-0" />
              <span className="truncate">Support & Manuel</span>
            </Link>
          </div>
        </div>
      </nav>
      )}

      {/* 3. FIXED BOTTOM FOOTER: Only RK logo when collapsed */}
      {isCollapsed ? (
        <div className="py-3 px-2 bg-[#031B3A] border-t border-[#0D3E82]/40 shrink-0 flex items-center justify-center">
          <img
            src="/logo-rk-emblem.png"
            alt="RK"
            className="w-8 h-auto object-contain"
          />
        </div>
      ) : (
        <div className="py-2.5 px-3 bg-[#031B3A] border-t border-[#0D3E82]/40 shrink-0 flex flex-col items-center justify-center">
          <img
            src="/logo-rk-emblem.png"
            alt="RKonekte"
            className="h-8 w-auto max-w-[120px] object-contain"
          />
          <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            {isSuperAdmin ? "Super-Administration" : "Gestion Digitalisée"}
          </span>
        </div>
      )}

      {/* 4. SUPPORT MODAL (Connecté à l'adresse mail officielle rkonekte509@gmail.com) */}
      {isSupportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsSupportOpen(false)}
        >
          <div
            className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#062653] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CircleHelp className="w-5 h-5 text-[#FF7900]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Support & Requêtes Entreprises</h3>
                  <p className="text-[11px] text-slate-300">Plateforme officielle RKonekte</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Pour toute demande d'assistance technique, requête administrative ou question relative à votre entreprise, notre équipe de support officiel est à votre disposition :
              </p>

              {/* Email Box with Copy */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-[#062653] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      E-mail de support officiel
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {supportEmail}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedEmail
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-1">
                <a
                  href={gmailWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir directement dans Gmail</span>
                </a>

                <a
                  href={mailtoUrl}
                  className="w-full py-2.5 px-4 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ouvrir l'application de messagerie</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                Délai habituel de réponse : sous 24h ouvrées.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
