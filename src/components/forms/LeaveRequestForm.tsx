"use client";

import React, { useState, useEffect } from "react";
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
  ArrowRight,
  Info,
} from "lucide-react";

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
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-lg text-center animate-in fade-in">
        <div className="flex items-center justify-center mx-auto mb-4 text-blue-600">
          <CheckCircle2 className="w-14 h-14" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Demande envoyée avec succès !
        </h2>

        <p className="text-slate-600 mb-6">
          Votre demande de congé a été enregistrée et transmise au secrétariat pour validation.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Numéro de demande
          </div>
          <div className="text-3xl font-mono font-bold text-blue-700">
            {submittedData.requestNumber}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">
                Conservez précieusement votre lien d'accès
              </h4>
              <p className="text-xs text-blue-800 mt-1">
                Ce lien sécurisé et personnel vous permet de suivre en direct le statut de votre demande (en attente, approuvée ou refusée).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Lien copié !" : "Copier le lien d'accès"}
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

        {/* SECTION: INFORMATIONS SUR L'EMPLOYÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-base border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>INFORMATIONS SUR L'EMPLOYÉ</span>
          </div>

          {employees.length > 0 && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
              <label className="block text-xs font-semibold text-blue-950 mb-1.5">
                Sélection rapide d'un employé pré-enregistré (Optionnel)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800"
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex. Dupont"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex. Jean"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                N° d'Employé <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="ex. EMP-042"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Département <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ex. Technique"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Poste <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ex. Technicien Réseau"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION: DÉTAILS DE LA DEMANDE DE CONGÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-base border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>DÉTAILS DE LA DEMANDE DE CONGÉ</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Type de congé <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { id: "ANNUAL", label: "Congé Annuel" },
                { id: "SICK", label: "Congé Maladie" },
                { id: "UNPAID", label: "Congé Sans Solde" },
                { id: "MATERNITY_PATERNITY", label: "Maternité / Paternité" },
                { id: "OTHER", label: "Autre" },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    leaveType === t.id
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-medium"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={t.id}
                    checked={leaveType === t.id}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {leaveType === "OTHER" && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Préciser le motif <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={leaveTypeOther}
                onChange={(e) => setLeaveTypeOther(e.target.value)}
                placeholder="Précisez la nature de votre demande..."
                className="w-full h-11 px-3.5 border border-blue-400 bg-blue-50/30 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Date de début <span className="text-rose-500">*</span>
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
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Date de fin <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate || new Date().toLocaleDateString("en-CA")}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nombre de jours calculé
              </label>
              <div className="h-11 px-3.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center font-bold text-slate-800">
                {requestedDays > 0 ? `${requestedDays} jour(s)` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: REMPLAÇANT PROPOSÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-base border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>REMPLAÇANT PROPOSÉ (Facultatif)</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Nom du remplaçant
            </label>
            <input
              type="text"
              value={replacementName}
              onChange={(e) => setReplacementName(e.target.value)}
              placeholder="ex. Paul Martin"
              className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
            />
          </div>
        </div>

        {/* SECTION: COORDONNÉES PENDANT LE CONGÉ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-base border-b border-slate-100 pb-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>COORDONNÉES PENDANT LE CONGÉ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Numéro de téléphone (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  minLength={8}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="ex. +225 0700000000 ou 38756867"
                  className="w-full h-11 pl-10 pr-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Utilisé pour recevoir votre notification de décision par WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Adresse email (Facultatif)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ex. jean.dupont@email.com"
                  className="w-full h-11 pl-10 pr-3.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: SIGNATURE & CONFIRMATION */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">Signature numérique :</strong> La soumission numérique de ce formulaire fait foi d'engagement et enregistre la date, l'heure et l'empreinte de transmission.
            </div>
          </div>

          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-blue-600 w-5 h-5 rounded-md mt-0.5 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-800">
              Je confirme que les informations fournies sont exactes.
            </span>
          </label>
        </div>

        {/* BOUTON SOUMETTRE */}
        <button
          type="submit"
          disabled={submitting || !confirmed}
          className="w-full py-4 px-6 min-h-[56px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-700/20 hover:shadow-blue-700/30 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-3">
              <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement en cours...
            </span>
          ) : (
            <>
              <span>Soumettre la demande</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
