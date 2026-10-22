"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Info,
  Upload,
  Type,
  Eraser,
} from "lucide-react";
import { processTransparentImage } from "@/lib/utils/signature";

interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phone: string;
  email?: string | null;
}

export function LeaveRequestForm({ preselectedOrgId }: { preselectedOrgId?: string }) {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Form State
  const [organizationId, setOrganizationId] = useState(preselectedOrgId || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SICK" | "UNPAID" | "MATERNITY_PATERNITY" | "OTHER">("ANNUAL");
  const [leaveTypeOther, setLeaveTypeOther] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestedDays, setRequestedDays] = useState<number>(0);
  const [replacementName, setReplacementName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Section 5 : Signature de l'Employé (Modes : Upload image sans fond, Écrire son nom)
  const [signatureMode, setSignatureMode] = useState<"upload" | "type">("upload");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [typedSignatureText, setTypedSignatureText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    requestNumber: string;
    accessToken: string;
    viewUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch active organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/public/organizations", { cache: "no-store" });
        const data = await res.json();
        if (data.organizations && data.organizations.length > 0) {
          setOrganizations(data.organizations);
          setOrganizationId((prev) => prev || data.organizations[0].id);
        } else if (data.error) {
          console.error("Server returned error:", data.error);
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
      } finally {
        setLoadingOrgs(false);
      }
    }
    loadOrgs();
  }, [preselectedOrgId]);

  // Fetch employees for selected organization
  useEffect(() => {
    async function loadEmployees() {
      if (!organizationId) {
        setEmployees([]);
        return;
      }
      try {
        const res = await fetch(`/api/public/employees?organizationId=${encodeURIComponent(organizationId)}`);
        const data = await res.json();
        if (data.employees) {
          setEmployees(data.employees);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    }
    loadEmployees();
  }, [organizationId]);

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFirstName(emp.firstName);
      setLastName(emp.lastName);
      setEmployeeNumber(emp.employeeNumber);
      setDepartment(emp.department);
      setPosition(emp.position);
      setContactPhone(emp.phone);
      if (emp.email) setContactEmail(emp.email);
    }
  };

  // Automatic calculation of days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        // Calculate inclusive calendar days
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setRequestedDays(diffDays);
      } else {
        setRequestedDays(0);
      }
    } else {
      setRequestedDays(0);
    }
  }, [startDate, endDate]);

  const isSignatureValid =
    signatureMode === "upload"
      ? Boolean(uploadedSignature)
      : Boolean(typedSignatureText.trim());

  const phoneDigits = contactPhone.replace(/\D/g, "");

  const isFormValid = Boolean(
    organizationId &&
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
    phoneDigits.length >= 8 &&
    isSignatureValid &&
    confirmed
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!organizationId) {
      setErrorMsg("Veuillez sélectionner votre entreprise");
      return;
    }

    if (!confirmed) {
      setErrorMsg("Veuillez confirmer l'exactitude des informations fournies");
      return;
    }

    if (leaveType === "OTHER" && !leaveTypeOther.trim()) {
      setErrorMsg("Veuillez préciser le motif de congé dans le champ 'Préciser'");
      return;
    }

    const phoneDigits = contactPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      setErrorMsg("Le numéro de téléphone (WhatsApp) doit comporter au moins 8 chiffres.");
      return;
    }

    if (requestedDays <= 0) {
      setErrorMsg("La date de fin doit être postérieure ou égale à la date de début");
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
      const res = await fetch("/api/public/submit-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          firstName,
          lastName,
          employeeNumber,
          department,
          position,
          leaveType,
          leaveTypeOther: leaveType === "OTHER" ? leaveTypeOther : undefined,
          startDate,
          endDate,
          requestedDays,
          replacementName: replacementName || undefined,
          contactPhone,
          contactEmail: contactEmail || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue lors de la soumission");
        return;
      }

      setSubmittedData({
        requestNumber: data.requestNumber,
        accessToken: data.accessToken,
        viewUrl: data.viewUrl,
      });
    } catch (err: any) {
      setErrorMsg("Erreur réseau. Veuillez vérifier votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (!submittedData) return;
    const fullUrl = `${window.location.origin}${submittedData.viewUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#DCE2EA] rounded-2xl p-6 sm:p-10 shadow-lg text-center animate-in fade-in">
        <div className="flex items-center justify-center mx-auto mb-4 text-[#062653]">
          <CheckCircle2 className="w-14 h-14 text-[#062653]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#062653] mb-2">
          Demande envoyée avec succès !
        </h2>

        <p className="text-[#64748B] mb-6 text-sm">
          Votre demande de congé a été enregistrée et transmise au secrétariat RH pour validation.
        </p>

        <div className="bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl p-6 mb-6">
          <div className="text-xs uppercase tracking-wider font-bold text-[#64748B] mb-1">
            Numéro de demande
          </div>
          <div className="text-3xl font-mono font-bold text-[#062653] border-b-2 border-[#FF7900] inline-block pb-1">
            {submittedData.requestNumber}
          </div>
        </div>

        <div className="bg-[#FFF4EB] border border-[#FF7900]/30 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#FF7900] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#062653] text-sm">
                Conservez précieusement votre lien d'accès
              </h4>
              <p className="text-xs text-[#263445] mt-1">
                Ce lien sécurisé et personnel vous permet de suivre en direct le statut de votre demande (en attente, approuvée ou refusée).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#062653] hover:bg-[#031B3A] text-white font-bold shadow-xs transition-colors cursor-pointer border-b-2 border-[#FF7900]"
          >
            <Copy className="w-4 h-4 text-[#FF7900]" />
            {copied ? "Lien copié dans le presse-papier !" : "Copier le lien d'accès"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
      <div className="border-b border-slate-100 pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Formulaire de Demande de Congé
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Remplissez tous les champs obligatoires ci-dessous pour soumettre votre demande.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION: ENTREPRISE */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Entreprise <span className="text-rose-500">*</span>
          </label>
          {loadingOrgs ? (
            <div className="h-11 bg-slate-100 animate-pulse rounded-lg" />
          ) : organizations.length === 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Aucune entreprise enregistrée pour le moment.</span>
              <a href="/register-company" className="font-bold text-[#FF7900] underline hover:text-[#E66D00]">
                Créer une entreprise &rarr;
              </a>
            </div>
          ) : (
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white transition-colors"
            >
              <option value="" disabled>
                Sélectionnez votre entreprise
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 1. INFORMATIONS SUR L'EMPLOYÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-[#062653] font-bold text-sm border-b border-[#DCE2EA] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="uppercase tracking-wider">Informations sur l'Employé :</span>
          </div>

          {employees.length > 0 && (
            <div className="p-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl">
              <label className="block text-xs font-bold text-[#062653] mb-1.5">
                Sélection rapide d'un employé pré-enregistré (Optionnel)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#DCE2EA] rounded-lg text-xs font-semibold text-[#263445]"
              >
                <option value="">-- Saisie manuelle ou choisir dans la liste --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.lastName.toUpperCase()} {emp.firstName} ({emp.employeeNumber}) — {emp.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                Nom : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom de famille"
                className="w-full h-11 px-3.5 border border-[#DCE2EA] rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                Prénom : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className="w-full h-11 px-3.5 border border-[#DCE2EA] rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                Numéro d'Employé : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="ex. EMP-042"
                className="w-full h-11 px-3.5 border border-[#DCE2EA] rounded-lg text-[#062653] placeholder:text-slate-400 focus:bg-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                Département : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ex. Comptabilité, Technique..."
                className="w-full h-11 px-3.5 border border-[#DCE2EA] rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                Poste : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ex. Responsable..."
                className="w-full h-11 px-3.5 border border-[#DCE2EA] rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* 2. DÉTAILS DE LA DEMANDE DE CONGÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-[#062653] font-bold text-sm border-b border-[#DCE2EA] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="uppercase tracking-wider">Détails de la Demande de Congé :</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#062653] mb-2">
              Type de Congé : <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { id: "ANNUAL", label: "Congé Annuel" },
                { id: "SICK", label: "Congé Maladie" },
                { id: "UNPAID", label: "Congé Sans Solde" },
                { id: "MATERNITY_PATERNITY", label: "Congé de Maternité/Paternité" },
                { id: "OTHER", label: "Autre (préciser)" },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                    leaveType === t.id
                      ? "border-[#062653] bg-[#062653]/5 font-bold text-[#062653] ring-2 ring-[#062653]/20"
                      : "border-[#DCE2EA] bg-white hover:bg-[#F8FAFC] text-[#263445]"
                  }`}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={t.id}
                    checked={leaveType === t.id}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      leaveType === t.id
                        ? "border-[#062653] bg-white ring-2 ring-[#062653]/20"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {leaveType === t.id && (
                      <div className="w-2 h-2 rounded-full bg-[#062653]" />
                    )}
                  </div>
                  <span className="text-xs">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {leaveType === "OTHER" && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-bold text-[#062653] mb-1.5">
                Autre (préciser) : <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={leaveTypeOther}
                onChange={(e) => setLeaveTypeOther(e.target.value)}
                placeholder="Préciser le motif de congé..."
                className="w-full h-11 px-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] placeholder:text-slate-400 focus:bg-white text-xs font-semibold focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#062653] mb-2">
              Dates du Congé :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1">
                  Date de Début : <span className="text-rose-500">*</span>
                  <span className="text-[10px] text-[#64748B] font-normal ml-1">(JJ/MM/AAAA)</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full h-11 px-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] focus:bg-white text-xs font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
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
                  min={startDate || new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] focus:bg-white text-xs font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#263445] mb-1">
                  Nombre de Jours de Congé Demandés :
                </label>
                <div className="h-11 px-3.5 bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between font-bold text-[#062653] text-xs cursor-not-allowed select-none">
                  <span>{requestedDays > 0 ? `${requestedDays} jour(s)` : "—"}</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. REMPLAÇANT PROPOSÉ (SI APPLICABLE) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[#062653] font-bold text-sm border-b border-[#DCE2EA] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="uppercase tracking-wider">Remplaçant Proposé (si applicable) :</span>
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
              className="w-full h-11 px-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] placeholder:text-slate-400 focus:bg-white text-xs font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
            />
          </div>
        </div>

        {/* 4. COORDONNÉES PENDANT LE CONGÉ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[#062653] font-bold text-sm border-b border-[#DCE2EA] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="uppercase tracking-wider">Coordonnées Pendant le Congé :</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1">
                Numéro de Téléphone : <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  minLength={8}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="ex. +509 0000 0000"
                  className="w-full h-11 pl-10 pr-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] placeholder:text-slate-400 focus:bg-white text-xs font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Utilisé pour vous joindre et recevoir vos notifications de validation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1">
                Adresse Email :
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ex. jean.dupont@email.com"
                  className="w-full h-11 pl-10 pr-3.5 border border-[#DCE2EA] bg-white rounded-xl text-[#062653] placeholder:text-slate-400 focus:bg-white text-xs font-medium focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 5. SIGNATURE DE L'EMPLOYÉ */}
        <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-[#062653] font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-[#062653] text-white flex items-center justify-center text-[10px] font-bold">5</span>
              <span className="uppercase tracking-wider">Signature de l'Employé :</span>
            </div>

            {/* Sélecteur de Mode */}
            <div className="flex items-center gap-1 p-1 bg-white border border-[#DCE2EA] rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setSignatureMode("upload")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === "upload"
                    ? "bg-[#062653] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#062653] hover:bg-slate-50"
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === "type"
                    ? "bg-[#062653] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#062653] hover:bg-slate-50"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Écrire mon nom</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#263445] mb-1">
                Date de soumission : <span className="text-[10px] text-[#64748B] font-normal">(JJ/MM/AAAA)</span>
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
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2EA] rounded-xl text-xs text-[#062653] font-semibold focus:ring-2 focus:ring-[#062653]/20 focus:border-[#062653] outline-hidden"
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

          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-[#062653] w-5 h-5 rounded-md mt-0.5 cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#062653] leading-relaxed">
              Je certifie sur l'honneur l'exactitude des renseignements portés sur ce formulaire de demande de congé.
            </span>
          </label>
        </div>

        {/* BOUTON SOUMETTRE VERT */}
        <button
          type="submit"
          disabled={submitting || !isFormValid}
          className="w-full py-4 px-6 min-h-[52px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-base font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-3">
              <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement en cours...
            </span>
          ) : (
            <span>Soumettre la demande de congé</span>
          )}
        </button>
      </form>
    </div>
  );
}
