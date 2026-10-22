"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building,
  Briefcase,
  FileText,
  BadgeCheck,
  RefreshCw,
  Phone,
  Mail,
  Eraser,
  Upload,
  Type,
  Plus,
} from "lucide-react";
import { processTransparentImage } from "@/lib/utils/signature";

interface EmployeeProfile {
  id?: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  position: string;
  branch: string;
  phone?: string;
  email: string;
}

interface LeaveRequestItem {
  id: string;
  requestNumber: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: string;
  submittedAt: number;
  rejectionReason?: string;
  replacementName?: string;
}

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "Congé Annuel" },
  { value: "SICK", label: "Congé Maladie" },
  { value: "UNPAID", label: "Congé Sans Solde" },
  { value: "MATERNITY_PATERNITY", label: "Congé de Maternité/Paternité" },
  { value: "OTHER", label: "Autre (préciser)" },
];

const PROFILE_STORAGE_KEY = "rkonekte_cached_employee_profile";

function getCachedProfile(): EmployeeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function EmployeeLeaveView() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [profile, setProfile] = useState<EmployeeProfile | null>(() => getCachedProfile());
  const [myRequests, setMyRequests] = useState<LeaveRequestItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(() => !getCachedProfile());
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Form State (5 Sections Officielles)
  // Section 1 : Informations sur l'Employé
  const [lastName, setLastName] = useState(() => getCachedProfile()?.lastName || "");
  const [firstName, setFirstName] = useState(() => getCachedProfile()?.firstName || "");
  const [employeeNumber, setEmployeeNumber] = useState(() => getCachedProfile()?.employeeNumber || "");
  const [department, setDepartment] = useState(() => getCachedProfile()?.department || "");
  const [position, setPosition] = useState(() => getCachedProfile()?.position || "");

  // Section 2 : Détails de la Demande de Congé
  const [leaveType, setLeaveType] = useState<string>("ANNUAL");
  const [leaveTypeOther, setLeaveTypeOther] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestedDays, setRequestedDays] = useState<number>(1);

  // Section 3 : Remplaçant Proposé
  const [replacementName, setReplacementName] = useState("");

  // Section 4 : Coordonnées Pendant le Congé
  const [contactPhone, setContactPhone] = useState(() => getCachedProfile()?.phone || "");
  const [contactEmail, setContactEmail] = useState(() => getCachedProfile()?.email || "");

  // Section 5 : Signature de l'Employé (Modes : Upload image sans fond, Écrire son nom)
  const [signatureMode, setSignatureMode] = useState<"upload" | "type">("upload");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [typedSignatureText, setTypedSignatureText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result as string;
      if (rawDataUrl) {
        const transparentDataUrl = await processTransparentImage(rawDataUrl);
        setUploadedSignature(transparentDataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearSignature = () => {
    setUploadedSignature(null);
    setTypedSignatureText("");
  };

  // Load employee profile & listen for profile updates
  useEffect(() => {
    const applyProfile = (p: any) => {
      if (!p) return;
      setProfile(p);
      if (p.lastName) setLastName(p.lastName);
      if (p.firstName) setFirstName(p.firstName);
      if (p.employeeNumber) setEmployeeNumber(p.employeeNumber);
      if (p.department) setDepartment(p.department);
      if (p.position) setPosition(p.position);
      if (p.phone) setContactPhone(p.phone);
      if (p.email) setContactEmail(p.email);
    };

    // Load from cache immediately
    const cached = getCachedProfile();
    if (cached) applyProfile(cached);

    fetch("/api/admin/my-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          applyProfile(data.profile);
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data.profile));
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));

    const handleProfileUpdate = (e: any) => {
      const p = e.detail || getCachedProfile();
      if (p) applyProfile(p);
    };

    window.addEventListener("rkonekte_profile_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("rkonekte_profile_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  // Calculate days when start or end changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setRequestedDays(diffDays);
      } else {
        setRequestedDays(0);
      }
    }
  }, [startDate, endDate]);

  // Load employee's own requests
  const loadMyRequests = () => {
    setLoadingRequests(true);
    fetch("/api/admin/requests?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items) {
          setMyRequests(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  const isSignatureValid =
    signatureMode === "upload"
      ? Boolean(uploadedSignature)
      : Boolean(typedSignatureText.trim());

  const isFormValid = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    employeeNumber.trim() &&
    department.trim() &&
    position.trim() &&
    leaveType &&
    (leaveType !== "OTHER" || leaveTypeOther.trim()) &&
    startDate &&
    endDate &&
    requestedDays > 0 &&
    contactPhone.trim() &&
    isSignatureValid &&
    confirmed
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!startDate || !endDate) {
      setErrorMsg("Veuillez sélectionner la date de début et la date de fin.");
      return;
    }

    if (requestedDays <= 0) {
      setErrorMsg("La date de fin doit être égale ou postérieure à la date de début.");
      return;
    }

    if (leaveType === "OTHER" && !leaveTypeOther.trim()) {
      setErrorMsg("Veuillez préciser le motif de votre demande de congé.");
      return;
    }

    const hasValidSignature =
      signatureMode === "upload"
        ? Boolean(uploadedSignature)
        : Boolean(typedSignatureText.trim());

    if (!hasValidSignature) {
      setErrorMsg(
        signatureMode === "upload"
          ? "Veuillez importer une photo ou un scan de votre signature."
          : "Veuillez renseigner votre nom complet pour la signature calligraphique."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        firstName: firstName.trim() || profile?.firstName || "Collaborateur",
        lastName: lastName.trim() || profile?.lastName || "",
        employeeNumber: employeeNumber.trim() || profile?.employeeNumber || "COLLAB",
        department: department.trim() || profile?.department || "Non renseigné",
        position: position.trim() || profile?.position || "Non renseigné",
        leaveType,
        leaveTypeOther: leaveType === "OTHER" ? leaveTypeOther.trim() : undefined,
        startDate,
        endDate,
        requestedDays,
        replacementName: replacementName.trim() || undefined,
        contactPhone: contactPhone.trim() || profile?.phone || "N/A",
        contactEmail: contactEmail.trim() || profile?.email || undefined,
      };

      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue lors de l'envoi.");
        return;
      }

      setSuccessMsg(`Votre formulaire de demande de congé a été enregistré avec succès (Réf: ${data.leaveRequest?.requestNumber || "Enregistrée"}).`);
      // Reset form
      setStartDate("");
      setEndDate("");
      setRequestedDays(1);
      setLeaveTypeOther("");
      setReplacementName("");
      setUploadedSignature(null);
      setTypedSignatureText("");
      clearSignature();
      setConfirmed(false);
      // Reload requests and switch to history
      loadMyRequests();
      setActiveTab("history");
    } catch (err: any) {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approuvée
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Refusée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            En attente de validation
          </span>
        );
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const found = LEAVE_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profil Header Collaborateur */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Mon Espace Congés
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Soumettez une demande en 1 clic et suivez les validations de la Direction.
          </p>
        </div>

        {/* Informations fixes pré-remplies (sans background, texte en gras) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#062653]">
          <div className="flex items-center gap-1.5">
            <span>Matricule :</span>
            {profile?.employeeNumber ? (
              <strong className="text-[#FF7900] font-mono font-bold">
                {profile.employeeNumber}
              </strong>
            ) : (
              <span className="inline-block w-24 h-3.5 bg-slate-200 animate-pulse rounded-sm" />
            )}
          </div>
          <span className="text-slate-300 font-normal">|</span>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            {profile?.branch ? (
              <span>{profile.branch}</span>
            ) : (
              <span className="inline-block w-20 h-3.5 bg-slate-200 animate-pulse rounded-sm" />
            )}
          </div>
          <span className="text-slate-300 font-normal">|</span>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            {profile?.position ? (
              <span>{profile.position}</span>
            ) : (
              <span>Employé</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Onglets Très Simple */}
      <div className="flex items-center gap-2 border-b border-[#DCE2EA] pb-1">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "form"
              ? "bg-[#062653] text-white shadow-xs"
              : "bg-white text-[#64748B] hover:text-[#062653] hover:bg-slate-50 border border-transparent"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle demande</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            loadMyRequests();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === "history"
              ? "bg-[#062653] text-white shadow-xs"
              : "bg-white text-[#64748B] hover:text-[#062653] hover:bg-slate-50 border border-transparent"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#F59E0B" />
            <path d="M8 4V8.2L10.8 9.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Mes demandes</span>
          {myRequests.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "history"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {myRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Messages d'alerte */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: FORMULAIRE OFFICIEL DE L'ENTREPRISE */}
      {activeTab === "form" && (
        <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xs p-6 md:p-8 animate-in fade-in">
          {/* Titre officiel du formulaire */}
          <div className="mb-6 pb-4 border-b border-[#DCE2EA]">
            <h2 className="text-xl font-bold text-[#062653] tracking-tight">
              Formulaire de Demande de Congé
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Remplissez les informations ci-dessous conformément au formulaire officiel de l'entreprise.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* 1. INFORMATIONS SUR L'EMPLOYÉ */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#062653] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Informations sur l'Employé :</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Nom : <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom de famille"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:bg-white focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Prénom : <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:bg-white focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#263445]">
                      Numéro d'Employé : <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#64748B] italic">Non modifiable</span>
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    tabIndex={-1}
                    value={employeeNumber}
                    title="Le numéro d'employé officiel (matricule) est attribué par l'administration et ne peut pas être modifié."
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-mono font-bold cursor-not-allowed select-none focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Département : <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex: Comptabilité, Logistique..."
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:bg-white focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Poste : <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ex: Responsable des Ventes"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:bg-white focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. DÉTAILS DE LA DEMANDE DE CONGÉ */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#062653] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Détails de la Demande de Congé :</span>
              </div>

              {/* Type de Congé */}
              <div>
                <label className="block text-xs font-bold text-[#062653] mb-2">
                  Type de Congé : <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {LEAVE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                        leaveType === type.value
                          ? "border-[#062653] bg-[#062653]/5 font-bold text-[#062653] ring-2 ring-[#062653]/20"
                          : "border-[#DCE2EA] bg-white hover:bg-[#F8FAFC] text-[#263445]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="leaveType"
                        value={type.value}
                        checked={leaveType === type.value}
                        onChange={() => setLeaveType(type.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          leaveType === type.value
                            ? "border-[#062653] bg-white ring-2 ring-[#062653]/20"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {leaveType === type.value && (
                          <div className="w-2 h-2 rounded-full bg-[#062653]" />
                        )}
                      </div>
                      <span className="text-xs">{type.label}</span>
                    </label>
                  ))}
                </div>

                {leaveType === "OTHER" && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-[#062653] mb-1">
                      Autre (préciser) : <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leaveTypeOther}
                      onChange={(e) => setLeaveTypeOther(e.target.value)}
                      placeholder="Préciser le motif de congé..."
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Dates du Congé */}
              <div>
                <label className="block text-xs font-bold text-[#062653] mb-2">
                  Dates du Congé :
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Date de Début : <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-[#64748B] font-normal ml-1">(JJ/MM/AAAA)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Date de Fin : <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-[#64748B] font-normal ml-1">(JJ/MM/AAAA)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#263445] mb-1">
                      Nombre de Jours de Congé Demandés :
                    </label>
                    <div className="px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-[#062653] flex items-center justify-between cursor-not-allowed select-none">
                      <span>{requestedDays > 0 ? `${requestedDays} jour(s)` : "—"}</span>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. REMPLAÇANT PROPOSÉ (SI APPLICABLE) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#062653] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Remplaçant Proposé (si applicable) :</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1">
                  Nom du Remplaçant :
                </label>
                <input
                  type="text"
                  value={replacementName}
                  onChange={(e) => setReplacementName(e.target.value)}
                  placeholder="Nom complet du collègue remplaçant si applicable"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                />
              </div>
            </div>

            {/* 4. COORDONNÉES PENDANT LE CONGÉ */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#062653] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Coordonnées Pendant le Congé :</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Numéro de Téléphone : <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+509 0000 0000"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Adresse Email :
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@entreprise.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 5. SIGNATURE DE L'EMPLOYÉ */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#062653] uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">5</span>
                  <span>Signature de l'Employé :</span>
                </div>

                {/* Sélecteur de Mode */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("upload")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      signatureMode === "upload"
                        ? "bg-[#062653] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#062653] hover:bg-white/60"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Uploader une image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode("type");
                      if (!typedSignatureText && (firstName || lastName)) {
                        setTypedSignatureText(`${firstName} ${lastName}`.trim());
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      signatureMode === "type"
                        ? "bg-[#062653] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#062653] hover:bg-white/60"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Écrire mon nom</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1">
                    Date : <span className="text-[10px] text-[#64748B] font-normal">(JJ/MM/AAAA)</span>
                  </label>
                  <div className="px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs font-bold text-[#062653]">
                    {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-2">
                    {signatureMode === "upload" && "Le fond blanc de la photo ou du scan est automatiquement retiré pour une signature nette sans arrière-plan."}
                    {signatureMode === "type" && "Votre nom est formaté en signature calligraphique officielle (police WindSong)."}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  {/* MODE 1 : UPLOAD AVEC DETOURAGE AUTOMATIQUE SANS BACKGROUND */}
                  {signatureMode === "upload" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />

                      {!uploadedSignature ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const raw = ev.target?.result as string;
                                if (raw) {
                                  const transparent = await processTransparentImage(raw);
                                  setUploadedSignature(transparent);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="border-2 border-dashed border-[#062653]/30 hover:border-[#062653] bg-white hover:bg-[#062653]/5 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[105px] group"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#062653]/10 text-[#062653] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-[#062653]">
                            Cliquez ou glissez une photo / scan de votre signature
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            PNG, JPG, WEBP — <span className="font-semibold text-emerald-600">Arrière-plan blanc automatiquement retiré (transparent)</span>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white border border-[#DCE2EA] rounded-xl p-3 relative flex flex-col items-center justify-center min-h-[105px]">
                          <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                            <span className="text-[11px] font-medium text-slate-400">
                              Arrière-plan retiré (transparent)
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[11px] text-[#062653] hover:underline font-bold cursor-pointer"
                              >
                                Remplacer
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setUploadedSignature(null)}
                                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <Eraser className="w-3 h-3" /> Supprimer
                              </button>
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-center py-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={uploadedSignature}
                              alt="Signature uploadée sans fond"
                              className="max-h-16 max-w-full object-contain filter drop-shadow-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 2 : ÉCRIRE MON NOM (CALLIGRAPHIE) */}
                  {signatureMode === "type" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typedSignatureText}
                        onChange={(e) => setTypedSignatureText(e.target.value)}
                        placeholder="Tapez votre prénom et nom..."
                        className="w-full px-3.5 py-2 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-semibold focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                      />
                      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center min-h-[75px] overflow-hidden">
                        {typedSignatureText.trim() ? (
                          <div className="text-center py-1">
                            <div className="font-windsong text-3xl sm:text-4xl text-[#062653] select-none py-1 leading-normal tracking-wide">
                              {typedSignatureText}
                            </div>
                            <div className="w-48 h-0.5 bg-[#062653]/30 mx-auto mt-0.5" />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Aperçu de la signature en police WindSong
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="accent-[#062653] w-4 h-4 rounded-md mt-0.5 cursor-pointer"
                />
                <span className="text-xs text-[#263445] leading-relaxed">
                  Je certifie sur l'honneur l'exactitude des renseignements portés sur ce formulaire de demande de congé.
                </span>
              </label>
            </div>

            {/* Bouton de Soumission Vert */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Envoi de votre demande...</span>
                  </>
                ) : (
                  <span>Envoyer ma demande de congé</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MES DEMANDES (HISTORIQUE ET STATUT) */}
      {activeTab === "history" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#062653]">
              Historique et statut de mes demandes
            </h2>
            <button
              onClick={loadMyRequests}
              className="text-xs text-[#64748B] hover:text-[#062653] flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? "animate-spin" : ""}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {loadingRequests ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#DCE2EA]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#062653] mx-auto mb-2" />
              <p className="text-xs text-[#64748B]">Chargement de vos demandes...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#DCE2EA] shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#062653]">Aucune demande pour le moment</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Vous n'avez pas encore soumis de demande de congé. Cliquez sur "Nouvelle demande" pour en formuler une.
              </p>
              <button
                onClick={() => setActiveTab("form")}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Faire une demande de congé
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-[#DCE2EA] shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#062653] bg-slate-100 px-2 py-0.5 rounded-md">
                        {req.requestNumber}
                      </span>
                      <span className="text-xs font-bold text-[#062653]">
                        {getLeaveTypeLabel(req.leaveType)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Du <strong>{req.startDate}</strong> au <strong>{req.endDate}</strong>
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        Durée : <strong>{req.requestedDays} jour(s)</strong>
                      </span>
                      {req.replacementName && (
                        <>
                          <span>•</span>
                          <span>Remplaçant : {req.replacementName}</span>
                        </>
                      )}
                    </div>

                    {req.status === "REJECTED" && req.rejectionReason && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        <strong>Motif du refus :</strong> {req.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center md:flex-col md:items-end gap-2">
                    {getStatusBadge(req.status)}
                    <span className="text-[11px] text-[#64748B]">
                      Soumis le {new Date(req.submittedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
