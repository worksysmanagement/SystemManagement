"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  AlertCircle,
  Eye,
  X,
  Check,
  Key,
  Copy,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Send,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { APP_CONFIG } from "@/config/app";
import { showSystemToast } from "@/components/ui/SystemToast";
import {
  generateEmployeeMatricule,
  updateMatriculeBranch,
  getNextMatriculeSequence,
} from "@/lib/utils/matricule";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ASSIGNED_ROLES = [
  {
    value: "ORGANIZATION_ADMIN",
    label: "Président Directeur Général (PDG) / Propriétaire — Direction",
  },
  {
    value: "ADMINISTRATEUR",
    label: "Administrateur — Direction",
  },
  {
    value: "RH",
    label: "Ressources Humaines (RH) — Management",
  },
  {
    value: "SECRETARY",
    label: "Secrétaire — Opérationnel",
  },
  {
    value: "BRANCH_MANAGER",
    label: "Responsable de Succursale — Management",
  },
  {
    value: "FINANCIAL_MANAGER",
    label: "Responsable Financier / Comptable — Management",
  },
  {
    value: "EMPLOYEE",
    label: "Collaborateur / Employé — Opérationnel",
  },
];

interface EmployeeItem {
  id: string;
  organizationId: string;
  branchId?: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  branch: string;
  department: string;
  position: string;
  birthDate?: string | null; // YYYY-MM-DD
  studyDomain?: string | null;
  bloodGroup?: string | null;
  medicalNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  phone: string;
  email?: string | null;
  status: "ACTIVE" | "INACTIVE";
  connectionStatus?: "CONNECTE" | "NON_CONNECTE" | "SANS_COMPTE";
  createdAt: number;
  updatedAt: number;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; code: string; name: string; city: string }>>([]);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [orgMatriculeFormat, setOrgMatriculeFormat] = useState<string>("INITIALS_BRANCH_SEQ");
  const [orgMatriculePrefix, setOrgMatriculePrefix] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const calculateAge = (birthDateStr?: string | null): number | null => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detail Drawer State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [formData, setFormData] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    branchId: "",
    branch: "Siège Principal",
    department: "",
    position: "",
    birthDate: "",
    studyDomain: "",
    bloodGroup: "",
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    phone: "",
    email: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Invitation & Password Reset Modal State
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [inviteModalData, setInviteModalData] = useState<{
    open: boolean;
    employeeName: string;
    email: string;
    inviteLink: string;
    emailSent: boolean;
  } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Confirmation modal before giving access / resending invite
  const [confirmInviteData, setConfirmInviteData] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    connectionStatus?: "CONNECTE" | "NON_CONNECTE" | "SANS_COMPTE";
  } | null>(null);
  const [confirmInviteError, setConfirmInviteError] = useState<string | null>(null);

  const handleResendInvite = (
    id: string,
    email?: string | null,
    name?: string,
    connectionStatus?: "CONNECTE" | "NON_CONNECTE" | "SANS_COMPTE"
  ) => {
    setConfirmInviteError(null);
    setConfirmInviteData({
      id,
      name: name || "Collaborateur",
      email: (email || "").trim(),
      role: "EMPLOYEE",
      connectionStatus: connectionStatus || (email ? "NON_CONNECTE" : "SANS_COMPTE"),
    });
  };

  const executeInvite = async (id: string, email: string, name?: string, role?: string) => {
    if (!email || !email.includes("@")) {
      setConfirmInviteError("Une adresse e-mail valide est obligatoire pour envoyer le lien d'accès.");
      return;
    }
    setResendingInviteId(id);
    setConfirmInviteError(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}/resend-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConfirmInviteError(data.error || "Erreur lors de l'activation.");
        return;
      }
      setConfirmInviteData(null);
      setInviteModalData({
        open: true,
        employeeName: name || "Collaborateur",
        email: email,
        inviteLink: data.inviteLink || `${window.location.origin}/reset-password`,
        emailSent: data.emailSent ?? true,
      });
      await fetchEmployees();
    } catch (err: any) {
      setConfirmInviteError("Erreur de connexion.");
    } finally {
      setResendingInviteId(null);
    }
  };

  // Load dynamic branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/api/admin/branches");
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            setOrganizationName(data.organization.name || data.organization.slug || "");
            if (data.organization.matriculeFormat) setOrgMatriculeFormat(data.organization.matriculeFormat);
            if (data.organization.matriculePrefix) setOrgMatriculePrefix(data.organization.matriculePrefix);
          }
          if (data.branches && Array.isArray(data.branches) && data.branches.length > 0) {
            setAvailableBranches(data.branches);
          }
        }
      } catch (_) {}
    }
    loadBranches();

    // Listen to global branch change event from AdminHeader
    const handleBranchChange = (e: any) => {
      if (e.detail?.branchId) {
        setBranchFilter(e.detail.branchId);
      }
    };
    window.addEventListener("branchChange", handleBranchChange);
    return () => window.removeEventListener("branchChange", handleBranchChange);
  }, []);

  // Initial fetch and mock enhancement for rich employee fields
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (branchFilter !== "ALL") params.set("branchId", branchFilter);

      const res = await fetch(`/api/admin/employees?${params.toString()}`);
      const data = await res.json();
      if (data.employees) {
        const enriched = data.employees.map((emp: any) => ({
          ...emp,
          branch:
            emp.branch ||
            availableBranches.find((b) => b.id === emp.branchId)?.name ||
            "Siège Principal",
          birthDate: emp.birthDate || "",
          studyDomain: emp.studyDomain || "",
          bloodGroup: emp.bloodGroup || "",
          medicalNotes: emp.medicalNotes || "",
          emergencyContactName: emp.emergencyContactName || "",
          emergencyContactRelation: emp.emergencyContactRelation || "",
          emergencyContactPhone: emp.emergencyContactPhone || "",
        }));
        setEmployees(enriched);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter, branchFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    const firstBranch = availableBranches[0];
    const existingMatricules = employees.map((e) => e.employeeNumber);
    const nextSeq = getNextMatriculeSequence(existingMatricules);
    const autoNum = generateEmployeeMatricule(
      organizationName,
      firstBranch?.code || "SIEGE",
      nextSeq,
      orgMatriculeFormat,
      orgMatriculePrefix
    );
    setFormData({
      employeeNumber: autoNum,
      firstName: "",
      lastName: "",
      branchId: firstBranch?.id || "",
      branch: firstBranch?.name || "Siège Principal",
      department: "",
      position: "",
      birthDate: "",
      studyDomain: "",
      bloodGroup: "",
      medicalNotes: "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      phone: "",
      email: "",
      status: "ACTIVE",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setFormData({
      employeeNumber: emp.employeeNumber,
      firstName: emp.firstName,
      lastName: emp.lastName,
      branchId: emp.branchId || "",
      branch: emp.branch || "Siège Principal",
      department: emp.department || "",
      position: emp.position || "",
      birthDate: emp.birthDate || "",
      studyDomain: emp.studyDomain || "",
      bloodGroup: emp.bloodGroup || "",
      medicalNotes: emp.medicalNotes || "",
      emergencyContactName: emp.emergencyContactName || "",
      emergencyContactRelation: emp.emergencyContactRelation || "",
      emergencyContactPhone: emp.emergencyContactPhone || "",
      phone: emp.phone || "",
      email: emp.email || "",
      status: emp.status || "ACTIVE",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Validation
    if (!formData.lastName.trim()) {
      setFormError("Le nom de famille est obligatoire.");
      setSaving(false);
      return;
    }
    if (!formData.firstName.trim()) {
      setFormError("Le prénom est obligatoire.");
      setSaving(false);
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Le numéro de téléphone est obligatoire.");
      setSaving(false);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setFormError("Une adresse email valide est obligatoire.");
      setSaving(false);
      return;
    }
    if (!formData.employeeNumber.trim()) {
      setFormError("Le matricule est obligatoire.");
      setSaving(false);
      return;
    }

    // Strict uniqueness check within the company
    const isDuplicateMatricule = employees.some(
      (emp) =>
        emp.id !== editingEmployee?.id &&
        emp.employeeNumber.toLowerCase().trim() === formData.employeeNumber.toLowerCase().trim()
    );
    if (isDuplicateMatricule) {
      setFormError(`Le matricule « ${formData.employeeNumber.trim()} » est déjà attribué à un autre collaborateur de cette entreprise. En aucun cas deux employés ne peuvent avoir le même matricule.`);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        employeeNumber: formData.employeeNumber.trim(),
        branchId: formData.branchId || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        department: formData.department.trim() || null,
        position: formData.position.trim() || null,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        birthDate: formData.birthDate || null,
        studyDomain: formData.studyDomain.trim() || null,
        bloodGroup: formData.bloodGroup.trim() || null,
        medicalNotes: formData.medicalNotes.trim() || null,
        emergencyContactName: formData.emergencyContactName.trim() || null,
        emergencyContactRelation: formData.emergencyContactRelation.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
        status: formData.status,
      };

      const url = editingEmployee
        ? `/api/admin/employees/${editingEmployee.id}`
        : "/api/admin/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFormError(resData.error || "Erreur lors de l'enregistrement");
        return;
      }

      setIsModalOpen(false);
      fetchEmployees();
      showSystemToast(
        editingEmployee
          ? "La fiche du collaborateur a été mise à jour avec succès."
          : "Collaborateur créé avec succès."
      );
    } catch (err: any) {
      setFormError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'employé « ${name} » ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showSystemToast(data.error || "Impossible de supprimer cet employé.", "error");
        return;
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmployee && selectedEmployee.id === id) {
        setSelectedEmployee(null);
      }
      showSystemToast(`Le collaborateur « ${name} » a été supprimé avec succès.`);
    } catch (err) {
      showSystemToast("Erreur réseau lors de la suppression.", "error");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (branchFilter !== "ALL" && branchFilter !== "all") {
      if (emp.branchId && emp.branchId === branchFilter) return true;
      const matchedBranch = availableBranches.find((b) => b.id === branchFilter);
      if (matchedBranch && emp.branch === matchedBranch.name) return true;
      if (emp.branch === branchFilter) return true;
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Gestion des Employés
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Répertoire centralisé des collaborateurs, coordonnées et informations d'urgence.
          </p>
        </div>

        <Link
          href="/admin/employees/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter un employé
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Tabs */}
          {[
            { id: "ALL", label: "Tous" },
            { id: "ACTIVE", label: "Actifs" },
            { id: "INACTIVE", label: "Inactifs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? "bg-[#062653] text-white"
                  : "bg-[#F4F6F9] text-[#64748B] hover:bg-slate-200/80 hover:text-[#263445]"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Branch Filter Dropdown */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-8 px-2.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs font-semibold text-[#263445] focus:bg-white"
          >
            <option value="ALL">Toutes les succursales</option>
            {(availableBranches.length > 0 ? availableBranches : APP_CONFIG.defaultBranches).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, matricule, poste..."
            className="w-full h-10 pl-9 pr-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder:text-[#64748B] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
        </form>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] text-xs">Chargement des employés...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            Aucun employé ne correspond aux filtres appliqués.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3.5">Matricule</th>
                  <th className="px-5 py-3.5">Employé</th>
                  <th className="px-5 py-3.5">Date de naissance</th>
                  <th className="px-5 py-3.5">Téléphone</th>
                  <th className="px-5 py-3.5">Rôle / Poste</th>
                  <th className="px-5 py-3.5">Succursale</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {filteredEmployees.map((emp) => {
                  const age = calculateAge(emp.birthDate);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#062653]">
                        {emp.employeeNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#263445]">
                          {emp.lastName.toUpperCase()} {emp.firstName}
                        </div>
                        <div className="text-[11px] text-[#64748B]">{emp.email || "Sans email"}</div>
                      </td>
                      <td className="px-5 py-4 text-[#263445]">
                        {emp.birthDate ? (
                          <div className="flex items-center gap-1.5">
                            <span>{emp.birthDate}</span>
                            {age !== null && (
                              <span className="text-[11px] text-slate-400 italic font-normal">
                                {age} ans
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#263445] font-mono">{emp.phone}</td>
                      <td className="px-5 py-4 font-semibold text-[#263445]">
                        {emp.position || (
                          <span className="text-[#94A3B8] font-normal italic text-xs">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#263445]">{emp.branch}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={emp.status} size="sm" />
                        <div className="mt-1">
                          {emp.connectionStatus === "CONNECTE" ? (
                            <span className="text-[10px] font-bold text-emerald-600">
                              Connecté
                            </span>
                          ) : emp.connectionStatus === "NON_CONNECTE" ? (
                            <span
                              className="text-[10px] font-bold text-[#FF7900]"
                              title="Invitation envoyée, compte en attente de mot de passe"
                            >
                              Non connecté
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-semibold text-slate-400"
                              title="Fiche RH sans compte d'accès utilisateur"
                            >
                              Fiche RH uniquement
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={resendingInviteId === emp.id}
                            onClick={() =>
                              handleResendInvite(
                                emp.id,
                                emp.email,
                                `${emp.firstName} ${emp.lastName}`,
                                emp.connectionStatus
                              )
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                              emp.connectionStatus === "CONNECTE"
                                ? "bg-black hover:bg-neutral-800 text-white"
                                : emp.connectionStatus === "NON_CONNECTE"
                                ? "bg-amber-50 hover:bg-amber-100 text-[#FF7900]"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                            title={
                              emp.connectionStatus === "CONNECTE"
                                ? "Réinitialiser le mot de passe"
                                : emp.connectionStatus === "NON_CONNECTE"
                                ? "Renvoyer l'invitation"
                                : "Activer l'accès utilisateur"
                            }
                          >
                            {resendingInviteId === emp.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Key className="w-4 h-4 shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(emp);
                            }}
                            className="w-8 h-8 rounded-lg bg-[#FF7900] hover:bg-[#E66D00] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4 text-white shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-white shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-white shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {mounted && selectedEmployee && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl border border-[#DCE2EA] shadow-2xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-7 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#FF7900]">
                  {selectedEmployee.employeeNumber}
                </span>
                <h2 className="text-base font-bold text-[#062653]">
                  {selectedEmployee.lastName.toUpperCase()} {selectedEmployee.firstName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. INFORMATIONS PRINCIPALES & CONTACT */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                1. Informations Principales & Contact
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Nom</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.lastName}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Prénom</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.firstName}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Matricule</span>
                  <div className="font-bold text-[#062653] font-mono mt-0.5">{selectedEmployee.employeeNumber}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Succursale</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.branch}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Téléphone</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.phone || "Non renseigné"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Email</span>
                  <div className="font-bold text-[#263445] mt-0.5 truncate" title={selectedEmployee.email || ""}>
                    {selectedEmployee.email || "Non renseigné"}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. POSTE & AFFECTATION */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                2. Poste & Affectation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Rôle / Poste</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.position || "Non renseigné"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Département</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.department || "Non renseigné"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Statut du compte</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedEmployee.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. INFORMATIONS PERSONNELLES & ÉTUDES */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                3. Informations Personnelles & Études
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Date de naissance</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.birthDate || "Non renseignée"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Âge</span>
                  <div className="font-bold text-[#263445] mt-0.5">
                    {calculateAge(selectedEmployee.birthDate) !== null ? (
                      <span className="text-[#FF7900] font-bold">{calculateAge(selectedEmployee.birthDate)} ans</span>
                    ) : (
                      "Non calculable"
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Domaine d'étude</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.studyDomain || "Non renseigné"}</div>
                </div>
              </div>
            </div>

            {/* 4. SANTÉ & DOSSIER MÉDICAL */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                4. Santé & Dossier Médical
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Groupe Sanguin</span>
                  <div className="mt-0.5">
                    {selectedEmployee.bloodGroup ? (
                      <span className="inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg">
                        {selectedEmployee.bloodGroup}
                      </span>
                    ) : (
                      <span className="font-medium text-[#64748B]">Non renseigné</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl sm:col-span-2">
                  <span className="text-[#64748B] font-semibold">Maladie / Conditions médicales</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.medicalNotes || "Aucune mention / Non renseigné"}</div>
                </div>
              </div>
            </div>

            {/* 5. APPEL EN CAS D'URGENCE */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                5. Appel en Cas d'Urgence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Personne à contacter</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.emergencyContactName || "Non renseigné"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Relation / Lien</span>
                  <div className="font-bold text-[#263445] mt-0.5">{selectedEmployee.emergencyContactRelation || "Non renseigné"}</div>
                </div>
                <div className="p-2.5 bg-[#F4F6F9] rounded-xl">
                  <span className="text-[#64748B] font-semibold">Téléphone d'urgence</span>
                  <div className="font-bold text-[#263445] font-mono mt-0.5">{selectedEmployee.emergencyContactPhone || "Non renseigné"}</div>
                </div>
              </div>
            </div>

            {/* 6. ACCÈS AU SYSTÈME & RÉINITIALISATION */}
            <div>
              <h3 className="text-xs font-bold text-[#FF7900] uppercase tracking-wider pb-1.5 border-b border-[#DCE2EA] mb-3">
                6. Accès au Système & Réinitialisation
              </h3>
              <div className="p-3.5 bg-[#F4F6F9] rounded-xl border border-[#DCE2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#062653]">
                      {selectedEmployee.email || "Aucune adresse e-mail"}
                    </span>
                    {selectedEmployee.connectionStatus === "CONNECTE" ? (
                      <span className="text-[10px] font-bold text-emerald-600">
                        Connecté
                      </span>
                    ) : selectedEmployee.connectionStatus === "NON_CONNECTE" ? (
                      <span className="text-[10px] font-bold text-[#FF7900]">
                        Non connecté
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">
                        Fiche RH uniquement
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {selectedEmployee.connectionStatus === "CONNECTE"
                      ? "Le collaborateur est actif sur le système. Vous pouvez lui renvoyer un lien de réinitialisation si nécessaire."
                      : selectedEmployee.connectionStatus === "NON_CONNECTE"
                      ? "Invitation envoyée. Le collaborateur doit utiliser son lien pour définir son mot de passe."
                      : "Cet employé a uniquement une fiche RH. Cliquez sur le bouton pour lui créer un compte d'accès."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={resendingInviteId === selectedEmployee.id}
                  onClick={() =>
                    handleResendInvite(
                      selectedEmployee.id,
                      selectedEmployee.email,
                      `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                      selectedEmployee.connectionStatus
                    )
                  }
                  className={`px-3.5 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50 ${
                    selectedEmployee.connectionStatus === "SANS_COMPTE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : selectedEmployee.connectionStatus === "CONNECTE"
                      ? "bg-black hover:bg-neutral-800 active:bg-neutral-900"
                      : "bg-[#062653] hover:bg-[#031B3A]"
                  }`}
                >
                  {resendingInviteId === selectedEmployee.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : selectedEmployee.connectionStatus === "SANS_COMPTE" ? (
                    <>
                      <Key className="w-3.5 h-3.5 text-white" />
                      Activer l'accès utilisateur
                    </>
                  ) : selectedEmployee.connectionStatus === "CONNECTE" ? (
                    <>
                      <Key className="w-3.5 h-3.5 text-white" />
                      Réinitialiser le mot de passe
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5 text-white" />
                      Renvoyer l'invitation
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE2EA] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const emp = selectedEmployee;
                  setSelectedEmployee(null);
                  openEditModal(emp);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-white" />
                Modifier cet employé
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-5 py-2 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE / EDIT MODAL */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl border border-[#DCE2EA] shadow-2xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-8 space-y-6 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#FF7900]">
                  {editingEmployee ? formData.employeeNumber : "Nouveau collaborateur"}
                </span>
                <h2 className="text-base font-bold text-[#062653]">
                  {editingEmployee ? "Modifier l'employé" : "Ajouter un nouvel employé"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* SECTION 1 : INFORMATIONS PRINCIPALES */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#DCE2EA]">
                  <h4 className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    1. Informations Principales
                  </h4>
                  <span className="text-[10px] text-red-600 font-semibold">* Champs obligatoires</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Nom de famille <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Nom de famille"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Prénom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Prénom"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Numéro de téléphone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+509 3000-0000"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Succursale d'affectation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.branchId || ""}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const found = availableBranches.find((b) => b.id === bId);
                        const updatedMatricule = !editingEmployee
                          ? updateMatriculeBranch(
                              formData.employeeNumber,
                              found?.code || "BR",
                              organizationName,
                              orgMatriculeFormat,
                              orgMatriculePrefix
                            )
                          : formData.employeeNumber;
                        setFormData({
                          ...formData,
                          branchId: bId,
                          branch: found ? found.name : "",
                          employeeNumber: updatedMatricule,
                        });
                      }}
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    >
                      <option value="" disabled>Choisir une succursale</option>
                      {(availableBranches.length > 0 ? availableBranches : APP_CONFIG.defaultBranches).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Matricule officiel <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value.toUpperCase() })}
                      placeholder="Ex: EB-SIEGE-001"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-bold font-mono focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Email du collaborateur <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="employe@entreprise.com"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 : POSTE & AFFECTATION */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#DCE2EA]">
                  <h4 className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    2. Poste & Affectation
                  </h4>
                  <span className="text-[10px] text-[#64748B]">Optionnelles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Poste / Rôle
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Ex: Conseiller commercial"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Département
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Ventes, Comptabilité"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Statut du compte
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "ACTIVE" | "INACTIVE",
                        })
                      }
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    >
                      <option value="ACTIVE">Actif (En service)</option>
                      <option value="INACTIVE">Inactif (Suspendu)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3 : INFORMATIONS PERSONNELLES & ÉTUDES */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#DCE2EA]">
                  <h4 className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    3. Informations Personnelles & Études
                  </h4>
                  <span className="text-[10px] text-[#64748B]">Optionnelles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#263445]">
                        Date de naissance
                      </label>
                      {calculateAge(formData.birthDate) !== null && (
                        <span className="text-[10px] font-bold text-[#FF7900] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                          Âge calculé : {calculateAge(formData.birthDate)} ans
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Domaine d'étude
                    </label>
                    <input
                      type="text"
                      value={formData.studyDomain}
                      onChange={(e) => setFormData({ ...formData, studyDomain: e.target.value })}
                      placeholder="Ex: Comptabilité, Gestion, Informatique..."
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4 : SANTÉ & DOSSIER MÉDICAL */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#DCE2EA]">
                  <h4 className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    4. Santé & Dossier Médical
                  </h4>
                  <span className="text-[10px] text-[#64748B]">Optionnelles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Groupe Sanguin
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors font-medium"
                    >
                      <option value="">Non renseigné</option>
                      {BLOOD_GROUPS.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Maladie / Conditions médicales
                    </label>
                    <input
                      type="text"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                      placeholder="Ex: Asthme, Allergie pénicilline, Diabète (laisser vide si aucune)"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5 : APPEL EN CAS D'URGENCE */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#DCE2EA]">
                  <h4 className="text-[11px] font-bold text-[#FF7900] uppercase tracking-wider">
                    5. Appel en Cas d'Urgence
                  </h4>
                  <span className="text-[10px] text-[#64748B]">Optionnelles</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Personne à contacter (Nom complet)
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="Ex: Marie Joseph"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Relation / Lien de parenté
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                      placeholder="Ex: Épouse, Père, Proche..."
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Numéro de téléphone d'urgence
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      placeholder="Ex: +509 3000-0000"
                      className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-3 border-t border-[#DCE2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
                {editingEmployee && (formData.email || editingEmployee.email) ? (
                  <button
                    type="button"
                    disabled={resendingInviteId === editingEmployee.id}
                    onClick={() =>
                      handleResendInvite(
                        editingEmployee.id,
                        formData.email || editingEmployee.email,
                        `${formData.firstName} ${formData.lastName}`,
                        editingEmployee.connectionStatus
                      )
                    }
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#062653] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Renvoyer l'invitation et le lien d'accès à cette adresse"
                  >
                    {resendingInviteId === editingEmployee.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-[#FF7900]" />
                        Renvoyer l'invitation
                      </>
                    )}
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#DCE2EA] text-[#64748B] hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* INVITATION & PASSWORD RESET MODAL */}
      {mounted && inviteModalData?.open && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl border border-[#DCE2EA] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scaleUp">
            {/* Close cross button (X) */}
            <button
              type="button"
              onClick={() => setInviteModalData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
              aria-label="Fermer la boîte de dialogue"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <div className="flex justify-center mx-auto mb-1">
                <img
                  src="/success-check.png"
                  alt="Succès"
                  className="w-14 h-14 object-contain drop-shadow-xs"
                />
              </div>
              <h2 className="text-lg font-bold text-[#062653]">
                Lien d'Accès Généré avec Succès !
              </h2>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {inviteModalData.emailSent ? (
                  <>
                    L'e-mail officiel avec le récapitulatif a été expédié à <strong className="text-[#062653]">{inviteModalData.email}</strong>.
                  </>
                ) : (
                  <>
                    Lien d'accès prêt pour <strong className="text-[#062653]">{inviteModalData.employeeName}</strong> ({inviteModalData.email}).
                  </>
                )}
              </p>
            </div>

            {/* DIRECT LINK INPUT */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#062653]">
                Lien d'activation & mot de passe (Usage Unique) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteModalData.inviteLink}
                  className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] select-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteModalData.inviteLink);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  }}
                  className="h-10 px-3.5 bg-[#062653] hover:bg-[#031B3A] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  title="Copier le lien"
                >
                  {inviteCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>

              {/* WHATSAPP BUTTON */}
              <button
                type="button"
                onClick={() => {
                  const message = `Bonjour ${inviteModalData.employeeName},\n\nVoici votre lien officiel pour activer votre compte RKonekte et choisir votre mot de passe :\n${inviteModalData.inviteLink}\n\nCordialement.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                }}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
              >
                <MessageSquare className="w-4 h-4" />
                Partager le lien sur WhatsApp
              </button>
            </div>

            <div className="pt-3 border-t border-[#DCE2EA] flex justify-end">
              <button
                type="button"
                onClick={() => setInviteModalData(null)}
                className="px-5 py-2.5 bg-[#062653] hover:bg-[#031B3A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION MODAL BEFORE GIVING ACCESS / SENDING INVITE */}
      {mounted && confirmInviteData && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl border border-[#DCE2EA] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                    confirmInviteData.connectionStatus === "CONNECTE"
                      ? "bg-[#FFF4EB] text-[#FF7900]"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#062653]">
                    {confirmInviteData.connectionStatus === "CONNECTE"
                      ? "Confirmer la réinitialisation d'accès"
                      : confirmInviteData.connectionStatus === "NON_CONNECTE"
                      ? "Confirmer le renvoi de l'invitation"
                      : "Confirmer la création d'accès"}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    {confirmInviteData.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmInviteData(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmInviteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{confirmInviteError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-[#DCE2EA] rounded-xl text-xs text-[#263445]">
              <p className="font-semibold text-[#062653] mb-0.5">
                {confirmInviteData.connectionStatus === "CONNECTE"
                  ? "Réinitialiser le mot de passe de ce compte ?"
                  : confirmInviteData.connectionStatus === "NON_CONNECTE"
                  ? "Renvoyer un nouveau lien d'activation ?"
                  : "Habiliter ce collaborateur sur la plateforme ?"}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {confirmInviteData.connectionStatus === "CONNECTE"
                  ? "Un lien de réinitialisation sécurisé sera généré. Le collaborateur pourra définir un nouveau mot de passe."
                  : confirmInviteData.connectionStatus === "NON_CONNECTE"
                  ? "Le lien d'invitation précédent sera invalidé et un nouveau lien officiel lui sera attribué."
                  : "Un compte d'accès officiel sera créé et un lien pour configurer son mot de passe sera généré."}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeInvite(
                  confirmInviteData.id,
                  confirmInviteData.email,
                  confirmInviteData.name,
                  confirmInviteData.role
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#062653] mb-1">
                  Adresse e-mail du collaborateur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus={!confirmInviteData.email}
                  placeholder="collaborateur@entreprise.com"
                  value={confirmInviteData.email}
                  onChange={(e) =>
                    setConfirmInviteData({ ...confirmInviteData, email: e.target.value })
                  }
                  className="w-full h-10 px-3.5 border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#062653] mb-1">
                  Rôle attribué <span className="text-rose-500">*</span>
                </label>
                <select
                  value={confirmInviteData.role}
                  onChange={(e) =>
                    setConfirmInviteData({ ...confirmInviteData, role: e.target.value })
                  }
                  className="w-full h-10 px-3.5 border border-[#062653] rounded-xl text-xs font-semibold text-[#062653] focus:bg-white focus:border-[#FF7900] transition-colors cursor-pointer shadow-xs"
                >
                  {ASSIGNED_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Définit les accès aux onglets et le niveau hiérarchique au sein de l'entreprise.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE2EA]">
                <button
                  type="button"
                  onClick={() => setConfirmInviteData(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resendingInviteId === confirmInviteData.id}
                  className={`px-4 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                    confirmInviteData.connectionStatus === "CONNECTE"
                      ? "bg-black hover:bg-neutral-800"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {resendingInviteId === confirmInviteData.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : confirmInviteData.connectionStatus === "CONNECTE" ? (
                    <>
                      <Key className="w-4 h-4" />
                      Confirmer et réinitialiser
                    </>
                  ) : confirmInviteData.connectionStatus === "NON_CONNECTE" ? (
                    <>
                      <Send className="w-4 h-4" />
                      Confirmer et renvoyer
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Confirmer et créer l'accès
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
