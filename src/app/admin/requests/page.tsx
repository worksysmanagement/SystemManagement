"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  PlusCircle,
  Eye,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { EmployeeLeaveView } from "@/components/requests/EmployeeLeaveView";
import { Check, X } from "lucide-react";

interface RequestItem {
  id: string;
  requestNumber: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: string;
  submittedAt: number;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<{ id: string; num: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setCurrentUserRole(data.user.role);
        } else {
          setCurrentUserRole("EMPLOYEE");
        }
      })
      .catch(() => {
        setCurrentUserRole("EMPLOYEE");
      });
  }, []);

  const isEmployee =
    currentUserRole === "EMPLOYEE" ||
    currentUserRole?.toLowerCase().includes("employ") ||
    currentUserRole?.toLowerCase().includes("collab") ||
    currentUserRole?.toLowerCase().includes("operat");

  const isMasterAccount =
    currentUserRole === "ORGANIZATION_ADMIN" ||
    currentUserRole === "SUPER_ADMIN" ||
    currentUserRole?.toLowerCase().includes("pdg") ||
    currentUserRole?.toLowerCase().includes("fondateur") ||
    currentUserRole?.toLowerCase().includes("directeur général") ||
    currentUserRole?.toLowerCase().includes("propriétaire");

  const fetchRequests = async (p = page, s = statusFilter, q = searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", p.toString());
      params.set("limit", "10");
      if (s !== "ALL") params.set("status", s);
      if (q.trim()) params.set("search", q.trim());

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setRequests(data.items);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, statusFilter, searchTerm);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests(1, statusFilter, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchRequests(newPage, statusFilter, searchTerm);
    }
  };

  const handleDelete = async (id: string, requestNumber: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement la demande N° ${requestNumber} ?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Impossible de supprimer la demande.");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setToastMessage(`La demande N° ${requestNumber} a été supprimée avec succès.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert("Erreur réseau lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickApprove = async (id: string, num: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionComment: "Approuvé par l'administration" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Impossible d'approuver la demande.");
        return;
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
      setToastMessage(`La demande N° ${num} a été approuvée avec succès.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert("Erreur réseau lors de l'approbation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickReject = async () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      alert("Veuillez indiquer un motif de refus.");
      return;
    }
    setActionLoadingId(rejectingItem.id);
    try {
      const res = await fetch(`/api/admin/requests/${rejectingItem.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionReason: rejectReason.trim(),
          decisionComment: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Impossible de rejeter la demande.");
        return;
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === rejectingItem.id ? { ...r, status: "REJECTED" } : r))
      );
      setToastMessage(`La demande N° ${rejectingItem.num} a été rejetée.`);
      setRejectingItem(null);
      setRejectReason("");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert("Erreur réseau lors du rejet.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (currentUserRole === null) {
    return (
      <div className="p-16 text-center text-xs text-[#64748B] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-[#FF7900] rounded-full animate-spin" />
        <span>Chargement de votre espace...</span>
      </div>
    );
  }

  // Si collaborateur / employé : Interface directe de soumission & suivi personnel
  if (isEmployee) {
    return <EmployeeLeaveView />;
  }

  return (
    <div className="space-y-6">
      {/* Modal de Rejet avec Motif */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#062653] mb-1">
              Motif du refus — Demande {rejectingItem.num}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Veuillez indiquer la raison du rejet. Elle sera communiquée au collaborateur.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Ex: Période de forte affluence en succursale, solde insuffisant..."
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 outline-hidden mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleQuickReject}
                disabled={actionLoadingId === rejectingItem.id || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Demandes de congé
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Consultez, recherchez et traitez les demandes de congé ({total} au total).
          </p>
        </div>

        {/* Bouton Nouvelle Demande de Congé (Vert, mais grisé/désactivé pour le compte Maître/PDG) */}
        <div className="relative group">
          <button
            type="button"
            disabled={isMasterAccount}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 self-start ${
              isMasterAccount
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle demande de congé</span>
          </button>
          {isMasterAccount && (
            <div className="hidden group-hover:block absolute right-0 top-full mt-1.5 w-72 p-2.5 bg-[#031B3A] text-white text-[11px] rounded-lg shadow-xl z-50 pointer-events-none">
              Compte Direction / Maître : Vous détenez l'autorité suprême de validation et ne formulez pas de demande pour vous-même.
            </div>
          )}
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "PENDING", label: "En attente" },
            { id: "APPROVED", label: "Approuvées" },
            { id: "REJECTED", label: "Refusées" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? "bg-[#062653] text-white"
                  : "bg-[#F4F6F9] text-[#64748B] hover:bg-slate-200/80 hover:text-[#263445]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher (nom, N° demande)..."
            className="w-full h-10 pl-9 pr-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder:text-[#64748B] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] text-xs">Chargement des demandes...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Aucune demande trouvée avec les critères actuels.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3.5">N° Demande</th>
                  <th className="px-5 py-3.5">Employé</th>
                  <th className="px-5 py-3.5">Département & Poste</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Période</th>
                  <th className="px-5 py-3.5">Jours</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#062653]">
                      {req.requestNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#263445]">
                        {req.firstName} {req.lastName}
                      </div>
                      <div className="text-[11px] text-[#64748B]">N° {req.employeeNumber}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[#263445] font-medium">{req.department}</div>
                      <div className="text-[11px] text-[#64748B]">{req.position}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-1 bg-[#F4F6F9] border border-[#DCE2EA] rounded-md text-[11px] font-semibold text-[#263445]">
                        {req.leaveType === "ANNUAL"
                          ? "Annuel"
                          : req.leaveType === "SICK"
                          ? "Maladie"
                          : req.leaveType === "UNPAID"
                          ? "Sans solde"
                          : req.leaveType === "MATERNITY_PATERNITY"
                          ? "Maternité/Paternité"
                          : "Autre"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#263445]">
                      <div className="font-medium">
                        {req.startDate} → {req.endDate}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#062653]">
                      {req.requestedDays} j
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(req.id, req.requestNumber)}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              title="Approuver directement en 1 clic"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Approuver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingItem({ id: req.id, num: req.requestNumber })}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              title="Refuser la demande"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Refuser</span>
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/requests/${req.id}`}
                          className="w-8 h-8 rounded-lg bg-[#062653] hover:bg-[#031B3A] text-white flex items-center justify-center transition-all shadow-xs"
                          title="Détails"
                        >
                          <Eye className="w-4 h-4 text-white shrink-0" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(req.id, req.requestNumber)}
                          disabled={deletingId === req.id}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-[#DCE2EA] flex items-center justify-between text-xs text-[#64748B]">
            <div>
              Page {page} sur {totalPages} ({total} résultats)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 border border-[#DCE2EA] rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 border border-[#DCE2EA] rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
