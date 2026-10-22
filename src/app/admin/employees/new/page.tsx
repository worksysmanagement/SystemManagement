"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  AlertCircle,
  Copy,
  Check,
  Send,
  UserPlus,
  RefreshCw,
  Mail,
  Building2,
  Phone,
  MessageSquare,
} from "lucide-react";
import {
  PhoneCountryInput,
  detectCountryFromPhone,
} from "@/components/ui/PhoneCountryInput";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { showSystemToast } from "@/components/ui/SystemToast";
import {
  generateEmployeeMatricule,
  updateMatriculeBranch,
  getNextMatriculeSequence,
} from "@/lib/utils/matricule";

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

export default function NewEmployeePage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string; city: string }>>([]);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; code: string; name: string } | null>(null);
  const [companyCountryIso, setCompanyCountryIso] = useState<string>("ht");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [orgMatriculeFormat, setOrgMatriculeFormat] = useState<string>("INITIALS_BRANCH_SEQ");
  const [orgMatriculePrefix, setOrgMatriculePrefix] = useState<string | null>(null);
  const [existingMatricules, setExistingMatricules] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    branchId: "",
    branch: "",
    phone: "",
    email: "",
    position: "",
    department: "",
    birthDate: "",
    studyDomain: "",
    bloodGroup: "",
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const calculateAge = (birthDateStr: string): number | null => {
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

  const [createAccount, setCreateAccount] = useState<boolean>(true);
  const [assignedRole, setAssignedRole] = useState<string>("EMPLOYEE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success modal state
  const [successData, setSuccessData] = useState<{
    employeeName: string;
    employeeNumber: string;
    email: string;
    inviteLink: string;
    emailSent: boolean;
    hasAccount: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (successData) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [successData]);
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/api/admin/branches");
        if (res.ok) {
          const data = await res.json();

          // Auto-detect country and organization name
          if (data.organization) {
            setOrganizationName(data.organization.name || data.organization.slug || "");
            if (data.organization.matriculeFormat) setOrgMatriculeFormat(data.organization.matriculeFormat);
            if (data.organization.matriculePrefix) setOrgMatriculePrefix(data.organization.matriculePrefix);
            const detected = detectCountryFromPhone(
              data.organization.phone,
              data.organization.address
            );
            if (detected) {
              setCompanyCountryIso(detected);
            }
          }

          if (data.branches && Array.isArray(data.branches) && data.branches.length > 0) {
            setBranches(data.branches);
            const firstBranch = data.branches[0];
            setSelectedBranch(firstBranch);
            
            // Fetch existing employees to compute the exact next sequential matricule
            let currentExistingMatricules: string[] = [];
            try {
              const empRes = await fetch("/api/admin/employees");
              if (empRes.ok) {
                const empData = await empRes.json();
                if (empData.employees && Array.isArray(empData.employees)) {
                  currentExistingMatricules = empData.employees.map((e: any) => e.employeeNumber);
                  setExistingMatricules(currentExistingMatricules);
                }
              }
            } catch (_) {}

            const nextSeq = getNextMatriculeSequence(currentExistingMatricules);
            const autoNum = generateEmployeeMatricule(
              data.organization?.name || data.organization?.slug,
              firstBranch.code,
              nextSeq,
              data.organization?.matriculeFormat || "INITIALS_BRANCH_SEQ",
              data.organization?.matriculePrefix
            );
            
            setFormData((prev) => ({
              ...prev,
              branchId: firstBranch.id,
              branch: firstBranch.name,
              employeeNumber: prev.employeeNumber || autoNum,
            }));
          }
        }
      } catch (_) {}
    }
    loadBranches();
  }, []);

  // Handle branch change: suggest matching matricule (Company-Branch-Digits)
  const handleBranchChange = (branchId: string) => {
    const found = branches.find((b) => b.id === branchId);
    if (found) {
      setSelectedBranch(found);
      const updatedMatricule = updateMatriculeBranch(
        formData.employeeNumber,
        found.code || "BR",
        organizationName,
        orgMatriculeFormat,
        orgMatriculePrefix
      );
      
      setFormData((prev) => ({
        ...prev,
        branchId: found.id,
        branch: found.name,
        employeeNumber: updatedMatricule,
      }));
    }
  };

  const isFormValid = Boolean(
    formData.lastName.trim() &&
    formData.firstName.trim() &&
    formData.phone.trim() &&
    formData.branchId.trim() &&
    formData.employeeNumber.trim() &&
    (!createAccount || (formData.email.trim() && formData.email.includes("@")))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation of the required fields
    if (!formData.lastName.trim()) {
      setError("Le nom de famille est obligatoire.");
      return;
    }
    if (!formData.firstName.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Le numéro de téléphone est obligatoire.");
      return;
    }
    if (createAccount && (!formData.email.trim() || !formData.email.includes("@"))) {
      setError("Une adresse e-mail valide est obligatoire pour créer le compte utilisateur et envoyer le lien d'invitation.");
      return;
    }
    if (formData.email.trim() && !formData.email.includes("@")) {
      setError("Le format de l'adresse e-mail est invalide.");
      return;
    }
    if (!formData.branchId) {
      setError("Veuillez sélectionner la succursale d'affectation.");
      return;
    }
    if (!formData.employeeNumber.trim()) {
      setError("Le numéro de matricule est obligatoire.");
      return;
    }

    // Strict uniqueness check: No two employees in the same company can share a matricule
    const normalizedInput = formData.employeeNumber.trim().toLowerCase();
    if (existingMatricules.some((m) => m && m.toLowerCase().trim() === normalizedInput)) {
      setError(`Le matricule « ${formData.employeeNumber.trim()} » est déjà attribué à un autre collaborateur de cette entreprise. En aucun cas deux employés ne peuvent avoir le même matricule.`);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        employeeNumber: formData.employeeNumber.trim(),
        branchId: formData.branchId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase() || null,
        department: formData.department.trim() || null,
        position: formData.position.trim() || null,
        birthDate: formData.birthDate || null,
        studyDomain: formData.studyDomain.trim() || null,
        bloodGroup: formData.bloodGroup.trim() || null,
        medicalNotes: formData.medicalNotes.trim() || null,
        emergencyContactName: formData.emergencyContactName.trim() || null,
        emergencyContactRelation: formData.emergencyContactRelation.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
        status: formData.status,
        createAccount,
        role: assignedRole,
      };

      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'enregistrement du collaborateur.");
        setSaving(false);
        return;
      }

      // Display the success modal with the invite link and WhatsApp share if account was created
      setExistingMatricules((prev) => [...prev, formData.employeeNumber.trim()]);
      showSystemToast(`Collaborateur « ${formData.firstName} ${formData.lastName} » créé avec succès !`);
      setSuccessData({
        employeeName: `${formData.firstName} ${formData.lastName}`.trim(),
        employeeNumber: formData.employeeNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        inviteLink: data.inviteLink || `${window.location.origin}/reset-password`,
        emailSent: data.emailSent ?? false,
        hasAccount: data.hasAccount ?? createAccount,
      });
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion réseau.");
      showSystemToast(err?.message || "Erreur de connexion réseau.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!successData?.inviteLink) return;
    navigator.clipboard.writeText(successData.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!successData) return;
    const message = `Bonjour ${successData.employeeName},\n\nVoici votre lien officiel pour activer votre compte RKonekte et choisir votre mot de passe :\n${successData.inviteLink}\n\nBienvenue dans l'équipe !`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleResetForm = () => {
    setSuccessData(null);
    const nextSeq = getNextMatriculeSequence(existingMatricules);
    const autoNum = generateEmployeeMatricule(
      organizationName,
      selectedBranch?.code,
      nextSeq,
      orgMatriculeFormat,
      orgMatriculePrefix
    );
    setFormData({
      employeeNumber: autoNum,
      firstName: "",
      lastName: "",
      branchId: selectedBranch?.id || "",
      branch: selectedBranch?.name || "",
      phone: "",
      email: "",
      position: "",
      department: "",
      birthDate: "",
      studyDomain: "",
      bloodGroup: "",
      medicalNotes: "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      status: "ACTIVE",
    });
    setAssignedRole("EMPLOYEE");
  };

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/employees"
          className="p-2 bg-white border border-[#DCE2EA] rounded-xl hover:bg-slate-50 text-[#64748B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Ajouter un employé
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Renseignez les informations de base. En cliquant sur enregistrer, un e-mail officiel avec le récapitulatif et le lien d'activation est automatiquement expédié au collaborateur.
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white rounded-2xl border border-[#DCE2EA] p-6 sm:p-8 lg:p-10 shadow-xs">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* OPTION COMPTE UTILISATEUR */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-[#DCE2EA] rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#062653] block">
                  Créer un compte d'accès utilisateur
                </span>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Si activé, un compte sera créé et une invitation avec lien de configuration de mot de passe sera envoyée.
                  Si désactivé, l'employé sera enregistré uniquement dans les fiches RH.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {createAccount && (
              <div className="pt-4 border-t border-[#DCE2EA]">
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Rôle attribué <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#062653] rounded-xl text-xs font-semibold text-[#062653] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20 transition-all cursor-pointer shadow-xs"
                  >
                    {ASSIGNED_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  Attribue les permissions d'accès aux modules et le niveau hiérarchique au collaborateur.
                </p>
              </div>
            )}
          </div>

          {/* 1. INFORMATIONS OBLIGATOIRES */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#062653] uppercase tracking-wider flex items-center gap-2">
                <span>1. Informations Obligatoires</span>
              </h3>
              <span className="text-[11px] text-red-600 font-semibold">
                * Champs requis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Nom de famille <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ex: Jean"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ex: Pierre"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                />
              </div>

              {/* Téléphone WhatsApp */}
              <div>
                <PhoneCountryInput
                  labelPosition="top"
                  defaultIso={companyCountryIso}
                  label={
                    <>
                      Numéro de téléphone (WhatsApp) <span className="text-rose-500">*</span>
                    </>
                  }
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  required
                />
              </div>

              {/* Succursale */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Succursale d'affectation <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.branchId}
                  onChange={(val) => handleBranchChange(val)}
                  placeholder={branches.length === 0 ? "Chargement des succursales..." : "Choisir une succursale"}
                  icon={<Building2 className="w-4 h-4 text-[#94A3B8]" />}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: `${b.name} (${b.city}) — Code: ${b.code}`,
                  }))}
                  required
                />
              </div>

              {/* Matricule rattaché à l'entreprise et la succursale */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#263445]">
                    Matricule officiel <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#64748B]">Entreprise & Succursale</span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value.toUpperCase() })}
                  placeholder="Ex: EB-SIEGE-001"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-bold focus:bg-white focus:border-[#FF7900] transition-colors font-mono"
                />
              </div>

              {/* Email qui reçoit le lien */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Email du collaborateur {createAccount ? <span className="text-rose-500">*</span> : <span className="text-[#94A3B8] font-normal">(Optionnel)</span>}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required={createAccount}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employe@entreprise.com"
                    className="w-full h-11 pl-10 pr-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1">
                  {createAccount
                    ? "Reçoit le récapitulatif complet et le lien pour choisir son mot de passe."
                    : "Adresse e-mail de contact (aucun compte ne sera activé)."}
                </p>
              </div>
            </div>
          </div>

          {/* 2. POSTE & DÉPARTEMENT */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#062653] uppercase tracking-wider">
                2. Poste & Affectation Interne
              </h3>
              <span className="text-[11px] text-[#64748B]">Optionnelles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rôle ou poste */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Poste / Rôle
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Conseiller commercial"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              {/* Département */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Département
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Ventes, Comptabilité"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              {/* Statut d'activité */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Statut initial
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val as any })}
                  options={[
                    { value: "ACTIVE", label: "Actif (En service)" },
                    { value: "INACTIVE", label: "Inactif (Suspendu)" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* 3. INFORMATIONS PERSONNELLES & ÉTUDES */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#062653] uppercase tracking-wider">
                3. Informations Personnelles & Études
              </h3>
              <span className="text-[11px] text-[#64748B]">Optionnelles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date de naissance */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#263445]">
                    Date de naissance
                  </label>
                  {calculateAge(formData.birthDate) !== null && (
                    <span className="text-[11px] font-bold text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
                      Âge : {calculateAge(formData.birthDate)} ans
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              {/* Domaine d'étude */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Domaine d'étude
                </label>
                <input
                  type="text"
                  value={formData.studyDomain}
                  onChange={(e) => setFormData({ ...formData, studyDomain: e.target.value })}
                  placeholder="Ex: Informatique de Gestion, Comptabilité..."
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. SANTÉ & DOSSIER MÉDICAL */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#062653] uppercase tracking-wider">
                4. Santé & Dossier Médical
              </h3>
              <span className="text-[11px] text-[#64748B]">Optionnelles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Groupe Sanguin */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Groupe Sanguin
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-medium"
                >
                  <option value="">Non précisé / Inconnu</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Maladie / Remarques médicales */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Maladie / Conditions médicales / Allergies
                </label>
                <input
                  type="text"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="Ex: Asthme, Allergie pénicilline, Aucune..."
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 5. APPEL EN CAS D'URGENCE */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#062653] uppercase tracking-wider">
                5. Appel en Cas d'Urgence
              </h3>
              <span className="text-[11px] text-[#64748B]">Optionnelles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Personne à contacter */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Personne à contacter (Nom complet)
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="Ex: Marie Piton"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              {/* Relation / Lien de parenté */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Relation / Lien de parenté
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  placeholder="Ex: Épouse, Mère, Frère, Proche..."
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              {/* Téléphone d'urgence */}
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                  Téléphone d'urgence
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="Ex: +509 3800-1122"
                  className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#FF7900] italic">
              {createAccount ? (
                <>
                  L'employé sera enregistré avec la mention <strong>« Non connecté »</strong> jusqu'à la création de son mot de passe.
                </>
              ) : (
                <>
                  L'employé sera enregistré avec la mention <strong>« Fiche RH uniquement »</strong> (aucun accès utilisateur créé).
                </>
              )}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <Link
                href="/admin/employees"
                className="w-full sm:w-auto px-5 py-3 border border-[#DCE2EA] text-[#64748B] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enregistrement en cours...
                  </>
                ) : createAccount ? (
                  "Enregistrer et envoyer l'invitation"
                ) : (
                  "Enregistrer la fiche employé"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {mounted && successData && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-2xl border border-[#DCE2EA] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-scaleUp">
            {/* Close cross button (X) */}
            <button
              type="button"
              onClick={handleResetForm}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
              aria-label="Fermer la boîte de dialogue"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-1">
              <div className="flex justify-center mx-auto mb-1">
                <img
                  src="/success-check.png"
                  alt="Succès"
                  className="w-16 h-16 object-contain drop-shadow-xs"
                />
              </div>
              <h2 className="text-xl font-bold text-[#062653]">
                {successData.hasAccount
                  ? "Collaborateur Enregistré avec Succès !"
                  : "Fiche RH Enregistrée avec Succès !"}
              </h2>
            </div>

            {/* RECAP INFORMATION (Clean, sans aucun fond) */}
            <div className="space-y-2 text-xs py-1">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Collaborateur :</span>
                <span className="font-bold text-[#062653]">{successData.employeeName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Matricule officiel :</span>
                <span className="font-bold text-[#FF7900]">{successData.employeeNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Statut initial :</span>
                <span className="font-bold text-[#062653]">
                  {successData.hasAccount
                    ? "Non connecté (En attente d'activation)"
                    : "Fiche RH uniquement (Sans compte d'accès)"}
                </span>
              </div>
            </div>

            {/* DIRECT LINK & ACTIONS FOR ACCOUNTS */}
            {successData.hasAccount ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#062653]">
                  Lien d'activation & mot de passe (Usage Unique) :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successData.inviteLink}
                    className="w-full h-11 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] select-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-11 px-4 bg-[#062653] hover:bg-[#031B3A] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    title="Copier le lien"
                  >
                    {copied ? (
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

                {/* WHATSAPP SHARE BUTTON */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Partager le lien sur WhatsApp
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-[#DCE2EA] rounded-xl text-xs text-[#64748B]">
                  L'employé est désormais actif dans le registre RH. Vous pourrez créer son compte de connexion à tout moment ultérieurement si nécessaire.
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/admin/employees"
                    className="flex-1 h-11 bg-[#062653] hover:bg-[#031B3A] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-xs"
                  >
                    Voir la liste des employés
                  </Link>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-11 px-4 border border-[#DCE2EA] hover:bg-slate-50 text-[#263445] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Ajouter un autre
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
