"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, X, ExternalLink, Users, Building2, Calendar, FileText, CheckCircle2, Clock, XCircle, Plus, Loader2, Lock } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

function KpiIcon({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url('${src}')`,
        maskImage: `url('${src}')`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

interface DashboardMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface RequestItem {
  id: string;
  requestNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: string;
  submittedAt: number;
}

interface EmployeeItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phone: string;
  email?: string | null;
  status: string;
}

interface BranchItem {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string | null;
  managerName?: string | null;
  phone?: string | null;
  status: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

type ModalCategory =
  | "total"
  | "pending"
  | "approved"
  | "rejected"
  | "employees"
  | "branches"
  | "users"
  | null;

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Record<string, any> | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Eye Modal state
  const [activeModal, setActiveModal] = useState<ModalCategory>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    if (activeModal) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [activeModal]);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, requestsRes, employeesRes, branchesRes, usersRes, permsRes] = await Promise.all([
          fetch("/api/admin/requests?mode=metrics"),
          fetch("/api/admin/requests?limit=100"),
          fetch("/api/admin/employees"),
          fetch("/api/admin/branches"),
          fetch("/api/admin/users"),
          fetch("/api/admin/my-permissions"),
        ]);

        const metricsData = await metricsRes.json().catch(() => ({}));
        const requestsData = await requestsRes.json().catch(() => ({}));
        const employeesData = await employeesRes.json().catch(() => ({}));
        const branchesData = await branchesRes.json().catch(() => ({}));
        const usersData = await usersRes.json().catch(() => ({}));
        const permsData = await permsRes.json().catch(() => ({}));

        const role = permsData?.role || "";
        const p = permsData?.permissions;
        const isEmp = role === "EMPLOYEE" || role === "COLLABORATEUR";

        // Access check: If dashboard view is explicitly false or if employee without explicit dashboard access
        const hasDashboardAccess = p?.dashboard !== undefined ? Boolean(p.dashboard.view) : !isEmp;

        if (!hasDashboardAccess) {
          // Immediately redirect to requests or first accessible tab
          const target = p?.requests?.view !== false ? "/admin/requests" : p?.events?.view ? "/admin/events" : "/admin/configuration";
          router.replace(target);
          return;
        }

        if (metricsData.metrics) setMetrics(metricsData.metrics);
        if (requestsData.items) setRequests(requestsData.items);
        if (employeesData.employees) setEmployees(employeesData.employees);
        if (branchesData.branches) setBranches(branchesData.branches);
        if (usersData.users) setUsers(usersData.users);
        if (permsData?.permissions) setUserPermissions(permsData.permissions);
        if (permsData?.role) setUserRole(permsData.role);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const isEmployee = userRole === "EMPLOYEE" || userRole === "COLLABORATEUR";
  const canSeeDashboard = userPermissions?.dashboard
    ? userPermissions.dashboard.view
    : userPermissions
    ? (isEmployee ? false : true)
    : false;

  const canCreateEmployee = userPermissions?.employees ? userPermissions.employees.create : !isEmployee;
  const canSeeEmployeesDetail = userPermissions?.employees ? userPermissions.employees.view : !isEmployee;
  const canSeeBranchesDetail = userPermissions?.branches ? userPermissions.branches.view : !isEmployee;
  const canSeeUsersDetail = userPermissions?.users ? userPermissions.users.view : !isEmployee;

  // Filter requests based on active modal
  const filteredRequests =
    activeModal === "pending"
      ? requests.filter((r) => r.status === "PENDING")
      : activeModal === "approved"
      ? requests.filter((r) => r.status === "APPROVED")
      : activeModal === "rejected"
      ? requests.filter((r) => r.status === "REJECTED")
      : requests;

  if (loading || !canSeeDashboard) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
        <Loader2 className="w-8 h-8 text-[#FF7900] animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#64748B]">Chargement de votre espace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">Tableau de bord</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Synthèse opérationnelle et gestion des activités de l'entreprise.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateEmployee ? (
            <Link
              href="/admin/employees/new"
              className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter employé</span>
            </Link>
          ) : (
            <Link
              href="/admin/requests"
              className="px-4 py-2.5 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer border-b-2 border-[#FF7900]"
            >
              <Plus className="w-4 h-4 text-[#FF7900]" />
              <span>Nouvelle requête</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* ROW 1: STRUCTURE ET COMPTES DE L'ENTREPRISE (Top row) */}
      {/* ================================================================ */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Structure & Effectif de l'entreprise
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
          {/* 1. NOMBRE D'EMPLOYÉS - SOLID NOCTURNAL BLUE #114C5A */}
          <div className="relative overflow-hidden bg-[#114C5A] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#114C5A] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {canSeeEmployeesDetail && (
                    <button
                      type="button"
                      onClick={() => setActiveModal("employees")}
                      title="Voir le tableau des employés"
                      aria-label="Voir le tableau des employés"
                      className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-100/90">
                    Nombre d'employés
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/employees.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : employees.length}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-teal-100/90">
              Effectif enregistré
            </div>
          </div>

          {/* 2. NOMBRE DE SUCCURSALES - SOLID DARK TEAL #044F58 */}
          <div className="relative overflow-hidden bg-[#044F58] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#044F58] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {canSeeBranchesDetail && (
                    <button
                      type="button"
                      onClick={() => setActiveModal("branches")}
                      title="Voir le tableau des succursales"
                      aria-label="Voir le tableau des succursales"
                      className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-100/90">
                    Nombre de succursales
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/branches.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : branches.length}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-teal-100/90">
              Succursales actives
            </div>
          </div>

          {/* 3. UTILISATEURS ENREGISTRÉS - CLOUD WHITE #EDF0F4 */}
          <div className="relative overflow-hidden bg-[#EDF0F4] text-[#062653] p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#DCE2EA] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {canSeeUsersDetail && (
                    <button
                      type="button"
                      onClick={() => setActiveModal("users")}
                      title="Voir le tableau des utilisateurs"
                      aria-label="Voir le tableau des utilisateurs"
                      className="text-[#062653] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-[#062653]/90">
                    Utilisateurs enregistrés
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/registered-users.png" className="w-8 h-8 sm:w-9 sm:h-9 text-[#062653]" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-[#062653]">
                {loading ? "..." : users.length}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-[#64748B]">
              Comptes d'accès actifs
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* ROW 2: FLUX DES CONGÉS (4 Solid colored cards) */}
      {/* ================================================================ */}
      <div className="pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Flux des demandes de congés
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {/* 1. TOTAL - SOLID BLUE #062653 */}
          <div className="relative overflow-hidden bg-[#062653] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#062653] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal("total")}
                    title="Voir le tableau de toutes les demandes"
                    aria-label="Voir le tableau de toutes les demandes"
                    className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                    Total Demandes
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/total-demandes.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : metrics.total}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-blue-100/90">
              Demandes enregistrées
            </div>
          </div>

          {/* 2. EN ATTENTE - SOLID ORANGE #FF7900 */}
          <div className="relative overflow-hidden bg-[#FF7900] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#FF7900] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal("pending")}
                    title="Voir les demandes en attente"
                    aria-label="Voir les demandes en attente"
                    className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-100/95">
                    En attente
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/en-attente.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : metrics.pending}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-amber-100/95">
              Décision requise
            </div>
          </div>

          {/* 3. APPROUVÉES (RESTORED!) - SOLID GREEN #059669 */}
          <div className="relative overflow-hidden bg-[#059669] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#059669] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal("approved")}
                    title="Voir les demandes approuvées"
                    aria-label="Voir les demandes approuvées"
                    className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100/95">
                    Approuvées
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/approuvees.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : metrics.approved}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-100/95">
              Validées et actives
            </div>
          </div>

          {/* 4. REFUSÉES - SOLID RED #DC2626 */}
          <div className="relative overflow-hidden bg-[#DC2626] text-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#DC2626] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal("rejected")}
                    title="Voir les demandes refusées"
                    aria-label="Voir les demandes refusées"
                    className="text-white hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-100/95">
                    Refusées
                  </span>
                </div>
                <KpiIcon src="/icons/kpi/refusees.png" className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="mt-3 text-4xl sm:text-[42px] font-black tracking-tight text-white">
                {loading ? "..." : metrics.rejected}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-rose-100/95">
              Demandes non retenues
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODALE D'INSPECTION RAPIDE (Bouton Œil) */}
      {/* ================================================================ */}
      {mounted && activeModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#031B3A]/65 backdrop-blur-md animate-in fade-in duration-200"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-[#DCE2EA] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#DCE2EA] flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#062653] text-white">
                  {activeModal === "employees" ? (
                    <Users className="w-5 h-5" />
                  ) : activeModal === "branches" ? (
                    <Building2 className="w-5 h-5" />
                  ) : activeModal === "users" ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#062653]">
                    {activeModal === "total" && "Toutes les demandes de congés"}
                    {activeModal === "pending" && "Demandes de congés en attente"}
                    {activeModal === "approved" && "Demandes de congés approuvées"}
                    {activeModal === "rejected" && "Demandes de congés refusées"}
                    {activeModal === "employees" && "Effectif des employés enregistrés"}
                    {activeModal === "branches" && "Liste des succursales actives"}
                    {activeModal === "users" && "Utilisateurs enregistrés dans l'entreprise"}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    {activeModal === "employees"
                      ? `${employees.length} employé(s) actif(s)`
                      : activeModal === "branches"
                      ? `${branches.length} succursale(s) répertoriée(s)`
                      : activeModal === "users"
                      ? `${users.length} compte(s) utilisateur(s)`
                      : `${filteredRequests.length} demande(s) trouvée(s)`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer la boîte de dialogue"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Table */}
            <div className="overflow-y-auto p-5 sm:p-6 max-h-[60vh]">
              {/* REQUESTS TABLE */}
              {(activeModal === "total" ||
                activeModal === "pending" ||
                activeModal === "approved" ||
                activeModal === "rejected") && (
                filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Aucune demande correspondante pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                        <tr>
                          <th className="px-4 py-3">N° Demande</th>
                          <th className="px-4 py-3">Employé</th>
                          <th className="px-4 py-3">Département</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Période</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE2EA]">
                        {filteredRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#062653]">
                              {req.requestNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#263445]">
                              {req.firstName} {req.lastName}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">{req.department}</td>
                            <td className="px-4 py-3 text-[#263445]">
                              {req.leaveType === "ANNUAL"
                                ? "Annuel"
                                : req.leaveType === "SICK"
                                ? "Maladie"
                                : req.leaveType === "UNPAID"
                                ? "Sans solde"
                                : req.leaveType === "MATERNITY_PATERNITY"
                                ? "Maternité/Paternité"
                                : "Autre"}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">
                              {req.startDate} → {req.endDate} ({req.requestedDays} j)
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={req.status} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* EMPLOYEES TABLE */}
              {activeModal === "employees" && (
                employees.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Aucun employé enregistré pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                        <tr>
                          <th className="px-4 py-3">Matricule</th>
                          <th className="px-4 py-3">Nom & Prénom</th>
                          <th className="px-4 py-3">Département</th>
                          <th className="px-4 py-3">Poste</th>
                          <th className="px-4 py-3">Téléphone</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE2EA]">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#062653]">
                              {emp.employeeNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#263445]">
                              {emp.firstName} {emp.lastName}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">{emp.department}</td>
                            <td className="px-4 py-3 text-[#263445]">{emp.position}</td>
                            <td className="px-4 py-3 text-[#64748B]">{emp.phone}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-emerald-600 tracking-wide">
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* BRANCHES TABLE */}
              {activeModal === "branches" && (
                branches.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Aucune succursale répertoriée pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Nom de la succursale</th>
                          <th className="px-4 py-3">Ville</th>
                          <th className="px-4 py-3">Responsable</th>
                          <th className="px-4 py-3">Téléphone</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE2EA]">
                        {branches.map((br) => (
                          <tr key={br.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#062653]">
                              {br.code}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#263445]">
                              {br.name}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">{br.city}</td>
                            <td className="px-4 py-3 text-[#263445]">{br.managerName || "—"}</td>
                            <td className="px-4 py-3 text-[#64748B]">{br.phone || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-emerald-600 tracking-wide">
                                {br.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* USERS TABLE */}
              {activeModal === "users" && (
                users.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Aucun utilisateur trouvé pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                        <tr>
                          <th className="px-4 py-3">Nom</th>
                          <th className="px-4 py-3">Adresse Email</th>
                          <th className="px-4 py-3">Rôle</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE2EA]">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[#263445]">{u.name}</td>
                            <td className="px-4 py-3 text-[#64748B] font-mono">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold text-[#062653]">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-emerald-600 tracking-wide">
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#DCE2EA] bg-slate-50/70 flex items-center justify-between gap-3">
              <Link
                href={
                  activeModal === "employees"
                    ? "/admin/employees"
                    : activeModal === "branches"
                    ? "/admin/branches"
                    : activeModal === "users"
                    ? "/admin/access-control"
                    : "/admin/requests"
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#062653] hover:text-[#FF7900] transition-colors"
              >
                <span>Accéder à la gestion complète</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-[#DCE2EA] hover:bg-slate-100 text-xs font-semibold text-[#263445] rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
