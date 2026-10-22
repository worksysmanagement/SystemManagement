"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Building2,
  Hash,
  Sparkles,
  Layers,
  Globe,
  DollarSign,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  getMatriculeFormatOptions,
  generateEmployeeMatricule,
  getOrganizationAcronym,
} from "@/lib/utils/matricule";
import { showSystemToast } from "@/components/ui/SystemToast";

export default function GeneralPreferencesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Backward-compatibility redirect if a query param ?tab= was passed,
  // or redirect employee to their personal profile
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signature") {
      router.replace("/admin/configuration/signature");
      return;
    } else if (tab === "profile") {
      router.replace("/admin/configuration/profile");
      return;
    } else if (tab === "security") {
      router.replace("/admin/configuration/security");
      return;
    } else if (tab === "notifications") {
      router.replace("/admin/configuration/notifications");
      return;
    }

    // Check if user is employee
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const role = data?.user?.role;
        const isEmp =
          role === "EMPLOYEE" ||
          role === "COLLABORATEUR" ||
          (typeof role === "string" &&
            (role.toLowerCase().includes("employ") || role.toLowerCase().includes("collab")));
        if (isEmp) {
          router.replace("/admin/configuration/profile");
        }
      })
      .catch(() => {});
  }, [searchParams, router]);

  // General Settings State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("e-biznis");
  const [language, setLanguage] = useState("fr");
  const [primaryCurrency, setPrimaryCurrency] = useState("HTG");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [matriculeFormat, setMatriculeFormat] = useState("INITIALS_BRANCH_SEQ");
  const [matriculePrefix, setMatriculePrefix] = useState("");

  // Load organization configuration from backend API
  useEffect(() => {
    async function loadOrgData() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/organization");
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            if (data.organization.name) setCompanyName(data.organization.name);
            if (data.organization.matriculeFormat) setMatriculeFormat(data.organization.matriculeFormat);
            if (data.organization.matriculePrefix) setMatriculePrefix(data.organization.matriculePrefix);
            if (data.organization.primaryCurrency) setPrimaryCurrency(data.organization.primaryCurrency);
            if (data.organization.dateFormat) setDateFormat(data.organization.dateFormat);
            if (data.organization.language) setLanguage(data.organization.language);
          }
        } else {
          // Local storage fallback
          const savedName = localStorage.getItem("rk_company_name");
          if (savedName) setCompanyName(savedName);
        }
      } catch (_) {
        const savedName = localStorage.getItem("rk_company_name");
        if (savedName) setCompanyName(savedName);
      } finally {
        setLoading(false);
      }
    }
    loadOrgData();
  }, []);

  // Compute dynamic format options tailored to companyName
  const formatOptions = getMatriculeFormatOptions(companyName);

  // Live preview calculation of the next sample matricule
  const livePreview = generateEmployeeMatricule(
    companyName,
    "SIEGE",
    "001",
    matriculeFormat,
    matriculePrefix || getOrganizationAcronym(companyName)
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyName.trim()) {
      showSystemToast("Le nom officiel de l'organisation est requis.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          matriculeFormat,
          matriculePrefix: matriculeFormat === "CUSTOM" ? matriculePrefix.trim().toUpperCase() : null,
          primaryCurrency,
          dateFormat,
          language,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        showSystemToast(resData.error || "Impossible d'enregistrer les modifications.", "error");
        return;
      }

      // Sync local caches & header/sidebar events
      if (typeof window !== "undefined") {
        localStorage.setItem("rk_company_name", companyName.trim());
        window.dispatchEvent(
          new CustomEvent("rkonekte_organization_updated", {
            detail: {
              name: companyName.trim(),
              matriculeFormat,
              matriculePrefix,
            },
          })
        );
      }

      // Affiche le popup en haut à droite avec fond subtilement flouté (style unifié)
      showSystemToast("Préférences générales et format de matricule enregistrés avec succès.");
    } catch (_) {
      showSystemToast("Erreur de connexion réseau lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF7900]" />
            Paramètres Système
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
          Préférences Générales
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Dénomination officielle, modèle de matricule des collaborateurs, langue du système, devise comptable et format de date.
        </p>
      </div>

      {/* 2. FORM CONTAINER */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#DCE2EA] p-6 sm:p-8 shadow-xs space-y-8">
        {/* SECTION A : IDENTITÉ & NOM OFFICIEL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Building2 className="w-4 h-4 text-[#062653]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
              Identité de l'Organisation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#062653] mb-1.5">
                Nom officiel de l'organisation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: e-biznis"
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs font-bold text-[#062653] focus:bg-white focus:border-[#FF7900] transition-colors"
              />
              <span className="text-[11px] text-[#64748B] mt-1.5 block">
                Ce nom officiel apparaît sur l'en-tête de tous les documents, rapports financiers et formulaires de congé générés.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION B : MODÈLE ET FORMAT DE MATRICULE SELON LE NOM */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#FF7900]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                Format & Numérotation des Matricules Employés
              </h2>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Incrémentation séquentielle automatique (001, 002...)
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Choisissez comment les matricules de vos collaborateurs doivent être automatiquement générés à partir du nom officiel de votre entreprise (<strong className="text-[#062653]">{companyName || "Entreprise"}</strong>).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-xs font-bold text-[#062653] mb-1.5">
                Modèle de matricule employé
              </label>
              <select
                value={matriculeFormat}
                onChange={(e) => setMatriculeFormat(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs font-semibold text-[#062653] focus:bg-white focus:border-[#FF7900] transition-colors cursor-pointer"
              >
                {formatOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — Ex: {opt.preview}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                {formatOptions.find((o) => o.id === matriculeFormat)?.description}
              </p>
            </div>

            {/* APERÇU EN TEMPS RÉEL DU MATRICULE GÉNÉRÉ */}
            <div className="p-4 bg-gradient-to-br from-[#F4F6F9] to-slate-50 border border-[#DCE2EA] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Aperçu du prochain matricule généré :
                </span>
                <span className="text-[10px] text-slate-400 italic">Siège (001)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-[#062653] bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs tracking-wider">
                  {livePreview}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                  Format actif
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Chaque nouvel employé recevra automatiquement ce format avec un numéro incrémental unique garanti sans doublon.
              </p>
            </div>
          </div>

          {/* CHAMP PRÉFIXE SUR MESURE SI CUSTOM EST SÉLECTIONNÉ */}
          {matriculeFormat === "CUSTOM" && (
            <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl space-y-2 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-[#062653]">
                Préfixe personnalisé de l'entreprise (2 à 6 lettres majuscules) :
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={8}
                  placeholder={`Ex: ${getOrganizationAcronym(companyName)}Z`}
                  value={matriculePrefix}
                  onChange={(e) => setMatriculePrefix(e.target.value.toUpperCase())}
                  className="w-48 h-10 px-3.5 bg-white border border-[#DCE2EA] rounded-xl text-xs font-mono font-bold text-[#062653] focus:border-[#FF7900] uppercase"
                />
                <span className="text-xs text-[#64748B]">
                  Exemple résultant : <strong className="font-mono text-[#062653]">{livePreview}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION C : PARAMÈTRES RÉGIONAUX & MONÉTAIRES */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Globe className="w-4 h-4 text-[#062653]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
              Préférences Régionales & Formats
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#062653] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#64748B]" />
                Langue du système
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs font-semibold text-[#062653] focus:bg-white"
              >
                <option value="fr">Français (Standard entreprise)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#062653] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#64748B]" />
                Devise comptable principale
              </label>
              <select
                value={primaryCurrency}
                onChange={(e) => setPrimaryCurrency(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs font-semibold text-[#062653] focus:bg-white"
              >
                <option value="HTG">HTG - Gourde Haïtienne (G)</option>
                <option value="USD">USD - Dollar Américain ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="DOP">DOP - Peso Dominicain ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#062653] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                Format de date
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs font-semibold text-[#062653] focus:bg-white"
              >
                <option value="DD/MM/YYYY">JJ/MM/AAAA (ex. 12/10/2026)</option>
                <option value="YYYY-MM-DD">AAAA-MM-JJ (ISO 8601)</option>
                <option value="MM/DD/YYYY">MM/JJ/AAAA (US)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. BOUTON ENREGISTRER */}
        <div className="pt-5 border-t border-[#DCE2EA] flex items-center justify-between">
          <p className="text-[11px] text-[#64748B] italic">
            Les modifications prennent effet immédiatement sur tous les formulaires et documents générés.
          </p>

          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Enregistrement en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
