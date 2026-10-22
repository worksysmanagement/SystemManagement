"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Check, X, Search, Clock, CheckCircle2, XCircle, Eye, Trash2 } from "lucide-react";
import { EmployeeSalaryRaiseView } from "@/components/requests/EmployeeSalaryRaiseView";

interface SalaryRaiseRequest {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  branch: string;
  currentSalary: string;
  requestedSalary: string;
  currency: string;
  reason: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy?: string;
}

const STORAGE_KEY = "rkonekte_salary_raise_requests";

const DEFAULT_SALARY_REQUESTS: SalaryRaiseRequest[] = [
  {
    id: "AUG-2026-001",
    employeeName: "Alice Smith",
    employeeNumber: "TEC-001",
    department: "Développement",
    branch: "Siège Principal",
    currentSalary: "85,000",
    requestedSalary: "105,000",
    currency: "HTG",
    reason: "Promotion au poste de Tech Lead et extension des responsabilités d'équipe.",
    submittedAt: "2026-03-25",
    status: "PENDING",
  },
  {
    id: "AUG-2026-002",
    employeeName: "Jean Kouassi",
    employeeNumber: "WES-001",
    department: "Logistique",
    branch: "Succursale Delmas",
    currentSalary: "45,000",
    requestedSalary: "55,000",
    currency: "HTG",
    reason: "Ajustement annuel suite à l'évaluation des performances positives.",
    submittedAt: "2026-03-20",
    status: "APPROVED",
    decidedBy: "Direction Générale",
  },
];

export default function SalaryRaiseRequestsPage() {
  const [requests, setRequests] = useState<SalaryRaiseRequest[]>(DEFAULT_SALARY_REQUESTS);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SalaryRaiseRequest | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRequests(JSON.parse(saved));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SALARY_REQUESTS));
      }
    } catch (_) {}
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

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeNumber: "",
    department: "Développement",
    branch: "Siège Principal",
    currentSalary: "",
    requestedSalary: "",
    currency: "HTG",
    reason: "",
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: SalaryRaiseRequest = {
      id: `AUG-2026-${String(requests.length + 1).padStart(3, "0")}`,
      employeeName: formData.employeeName,
      employeeNumber: formData.employeeNumber,
      department: formData.department,
      branch: formData.branch,
      currentSalary: formData.currentSalary,
      requestedSalary: formData.requestedSalary,
      currency: formData.currency,
      reason: formData.reason,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "PENDING",
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    setShowNewModal(false);
    setFormData({
      employeeName: "",
      employeeNumber: "",
      department: "Développement",
      branch: "Siège Principal",
      currentSalary: "",
      requestedSalary: "",
      currency: "HTG",
      reason: "",
    });
  };

  const handleDecision = (id: string, newStatus: "APPROVED" | "REJECTED") => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status: newStatus, decidedBy: "Direction Générale" } : r
    );
    setRequests(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus, decidedBy: "Direction Générale" } : null));
    }
    setToastMessage(`Demande ${id} mise à jour : ${newStatus === "APPROVED" ? "Approuvée" : "Refusée"}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = requests.filter((r) => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement la demande d'augmentation pour ${name} (${id}) ?`)) {
      return;
    }
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(null);
    }
    setToastMessage(`La demande ${id} a été supprimée avec succès.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (currentUserRole === null) {
    return (
      <div className="p-16 text-center text-xs text-[#64748B] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-[#FF7900] rounded-full animate-spin" />
        <span>Chargement de votre espace...</span>
      </div>
    );
  }

  if (isEmployee) {
    return <EmployeeSalaryRaiseView />;
  }

  return (
    <div className="space-y-6">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Demandes d'Augmentation
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Gestion et traitement des demandes d'ajustement salarial des employés.
          </p>
        </div>

        {/* Bouton Nouvelle Demande d'Augmentation (Vert, mais grisé/désactivé pour le compte Maître/PDG) */}
        <div className="relative group">
          <button
            type="button"
            disabled={isMasterAccount}
            onClick={() => !isMasterAccount && setShowNewModal(true)}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 self-start ${
              isMasterAccount
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle demande d'augmentation</span>
          </button>
          {isMasterAccount && (
            <div className="hidden group-hover:block absolute right-0 top-full mt-1.5 w-72 p-2.5 bg-[#031B3A] text-white text-[11px] rounded-lg shadow-xl z-50 pointer-events-none">
              Compte Direction / Maître : Vous détenez l'autorité suprême de validation et ne formulez pas de demande pour vous-même.
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "PENDING", label: "En attente" },
            { id: "APPROVED", label: "Approuvées" },
            { id: "REJECTED", label: "Refusées" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterStatus === tab.id
                  ? "bg-[#062653] text-white"
                  : "bg-[#F4F6F9] text-[#64748B] hover:bg-slate-200/80 hover:text-[#263445]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher employé..."
            className="w-full h-10 pl-9 pr-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder:text-[#64748B] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Aucune demande d'augmentation ne correspond aux filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3.5">Référence</th>
                  <th className="px-5 py-3.5">Employé</th>
                  <th className="px-5 py-3.5">Succursale & Département</th>
                  <th className="px-5 py-3.5">Salaire Actuel</th>
                  <th className="px-5 py-3.5">Salaire Demandé</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#062653]">{req.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#263445]">{req.employeeName}</div>
                      <div className="text-[11px] text-[#64748B]">N° {req.employeeNumber}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[#263445] font-medium">{req.branch}</div>
                      <div className="text-[11px] text-[#64748B]">{req.department}</div>
                    </td>
                    <td className="px-5 py-4 text-[#263445] font-medium">
                      {req.currentSalary} {req.currency}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#062653]">
                      {req.requestedSalary} {req.currency}
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">{req.submittedAt}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          req.status === "APPROVED"
                            ? "text-emerald-600"
                            : req.status === "REJECTED"
                            ? "text-rose-600"
                            : "text-[#FF7900]"
                        }`}
                      >
                        {req.status === "APPROVED" ? (
                          <>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="8" cy="8" r="8" fill="#10B981" />
                              <path d="M4.5 8.2L6.8 10.5L11.5 5.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Approuvée
                          </>
                        ) : req.status === "REJECTED" ? (
                          <>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="8" cy="8" r="8" fill="#EF4444" />
                              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Refusée
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="8" cy="8" r="8" fill="#F59E0B" />
                              <path d="M8 4V8.2L10.8 9.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            En attente
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="w-8 h-8 rounded-lg bg-[#FF7900] hover:bg-[#E66D00] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4 text-white shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(req.id, req.employeeName)}
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-white shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xl max-w-lg w-full p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <div>
                <span className="text-[11px] font-bold text-[#FF7900]">
                  {selectedRequest.id}
                </span>
                <h2 className="text-base font-bold text-[#062653]">Détail de la demande</h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-[#64748B] hover:text-[#263445]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F4F6F9] rounded-xl">
                <span className="text-[#64748B] font-semibold">Employé</span>
                <div className="font-bold text-[#263445] mt-1">{selectedRequest.employeeName}</div>
                <div className="text-[#64748B]">N° {selectedRequest.employeeNumber}</div>
              </div>

              <div className="p-3 bg-[#F4F6F9] rounded-xl">
                <span className="text-[#64748B] font-semibold">Affectation</span>
                <div className="font-bold text-[#263445] mt-1">{selectedRequest.branch}</div>
                <div className="text-[#64748B]">{selectedRequest.department}</div>
              </div>

              <div className="p-3 bg-[#F4F6F9] rounded-xl">
                <span className="text-[#64748B] font-semibold">Salaire Actuel</span>
                <div className="font-bold text-[#263445] mt-1">
                  {selectedRequest.currentSalary} {selectedRequest.currency}
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-400/40">
                <span className="text-yellow-700 font-semibold">Salaire Proposé</span>
                <div className="font-bold text-[#062653] mt-1 text-sm">
                  {selectedRequest.requestedSalary} {selectedRequest.currency}
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#64748B] block mb-1">
                Justification & Objectifs :
              </span>
              <div className="p-3 bg-[#F4F6F9] rounded-xl text-xs text-[#263445] leading-relaxed">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.status === "PENDING" && (
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#DCE2EA]">
                <button
                  onClick={() => handleDecision(selectedRequest.id, "REJECTED")}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Refuser
                </button>
                <button
                  onClick={() => handleDecision(selectedRequest.id, "APPROVED")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Approuver l'augmentation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <h2 className="text-base font-bold text-[#062653]">
                Soumettre une demande d'augmentation
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-[#64748B] hover:text-[#263445]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Nom de l'employé *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    placeholder="Ex: Marc Bamba"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Numéro Employé *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    placeholder="Ex: TEC-002"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Succursale *
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  >
                    <option value="Siège Principal">Siège Principal</option>
                    <option value="Succursale Delmas">Succursale Delmas</option>
                    <option value="Succursale Pétion-Ville">Succursale Pétion-Ville</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Département *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Salaire Actuel *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                    placeholder="50,000"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Salaire Demandé *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requestedSalary}
                    onChange={(e) => setFormData({ ...formData, requestedSalary: e.target.value })}
                    placeholder="65,000"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Devise *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  >
                    <option value="HTG">HTG (Gourde)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1">
                  Justification détaillée *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Motif de la demande, accomplissements, nouvelles tâches..."
                  className="w-full p-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#DCE2EA]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-white border border-[#DCE2EA] text-[#64748B] hover:bg-slate-50 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    !formData.employeeName.trim() ||
                    !formData.employeeNumber.trim() ||
                    !formData.department.trim() ||
                    !formData.currentSalary.trim() ||
                    !formData.requestedSalary.trim() ||
                    !formData.reason.trim()
                  }
                  className="px-4 py-2 bg-[#FF7900] hover:bg-[#E66D00] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
                >
                  Soumettre la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
