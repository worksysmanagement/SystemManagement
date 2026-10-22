"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  X,
  Check,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function MyProfileDossierPage() {
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    id: "",
    employeeNumber: "",
    firstName: "",
    lastName: "",
    branch: "",
    department: "",
    position: "",
    phone: "",
    email: "",
    birthDate: "",
    studyDomain: "",
    bloodGroup: "",
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

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
    // 1. Try to load cached profile immediately
    try {
      const raw = localStorage.getItem("rkonekte_cached_employee_profile");
      if (raw) {
        const cached = JSON.parse(raw);
        const sanitizeDefault = (v?: string | null) =>
          !v || v === "Général" || v === "Collaborateur" ? "" : v;
        setProfileData((prev) => ({
          ...prev,
          id: cached.id || "",
          employeeNumber: cached.employeeNumber || "",
          firstName: cached.firstName || "",
          lastName: cached.lastName || "",
          branch: cached.branch || "Siège Principal",
          department: sanitizeDefault(cached.department),
          position: sanitizeDefault(cached.position),
          phone: cached.phone || "",
          email: cached.email || "",
          birthDate: cached.birthDate || "",
          studyDomain: cached.studyDomain || "",
          bloodGroup: cached.bloodGroup || "",
          medicalNotes: cached.medicalNotes || "",
          emergencyContactName: cached.emergencyContactName || "",
          emergencyContactRelation: cached.emergencyContactRelation || "",
          emergencyContactPhone: cached.emergencyContactPhone || "",
        }));
      }
    } catch (_) {}

    // 2. Fetch fresh profile from API
    setProfileLoading(true);
    fetch("/api/admin/my-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          const sanitizeDefault = (v?: string | null) =>
            !v || v === "Général" || v === "Collaborateur" ? "" : v;
          setProfileData({
            id: data.profile.id || "",
            employeeNumber: data.profile.employeeNumber || "",
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            branch: data.profile.branch || "Siège Principal",
            department: sanitizeDefault(data.profile.department),
            position: sanitizeDefault(data.profile.position),
            phone: data.profile.phone || "",
            email: data.profile.email || "",
            birthDate: data.profile.birthDate || "",
            studyDomain: data.profile.studyDomain || "",
            bloodGroup: data.profile.bloodGroup || "",
            medicalNotes: data.profile.medicalNotes || "",
            emergencyContactName: data.profile.emergencyContactName || "",
            emergencyContactRelation: data.profile.emergencyContactRelation || "",
            emergencyContactPhone: data.profile.emergencyContactPhone || "",
          });
          try {
            localStorage.setItem(
              "rkonekte_cached_employee_profile",
              JSON.stringify(data.profile)
            );
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const res = await fetch("/api/admin/my-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profileData.phone,
          birthDate: profileData.birthDate,
          studyDomain: profileData.studyDomain,
          bloodGroup: profileData.bloodGroup,
          medicalNotes: profileData.medicalNotes,
          emergencyContactName: profileData.emergencyContactName,
          emergencyContactRelation: profileData.emergencyContactRelation,
          emergencyContactPhone: profileData.emergencyContactPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Impossible d'enregistrer votre dossier");
        return;
      }

      try {
        const fullSaved = {
          ...profileData,
          ...(data.profile || {}),
        };
        localStorage.setItem(
          "rkonekte_cached_employee_profile",
          JSON.stringify(fullSaved)
        );
        window.dispatchEvent(
          new CustomEvent("rkonekte_profile_updated", { detail: fullSaved })
        );
        window.dispatchEvent(new Event("storage"));
      } catch (_) {}

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 5000);
    } catch (_) {
      setProfileError("Erreur réseau lors de l'enregistrement");
      setTimeout(() => setProfileError(null), 5000);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
            Dossier Collaborateur
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
          Mon Dossier Personnel
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Consultez et mettez à jour vos renseignements personnels, coordonnées de contact, groupe sanguin et contacts d'urgence.
        </p>
      </div>

      {/* POPUP STYLE PHOTO 2 (Positionné en haut à droite avec fond légèrement flouté) */}
      {profileSaved && (
        <>
          {/* Fond subtilement flouté sans bloquer les clics */}
          <div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[9990] pointer-events-none animate-in fade-in duration-300"
            aria-hidden="true"
          />

          <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Label "Success" au-dessus */}
            <div className="text-sm font-bold text-emerald-500 mb-1 pl-1">
              Success
            </div>

            <div className="relative">
              {/* Plaque d'accentuation verte en arrière-plan décalée en bas et à gauche */}
              <div className="absolute -left-1.5 -bottom-1.5 inset-0 bg-emerald-500 rounded-xs" />

              {/* Carte blanche principale avec verre flouté et ombre douce */}
              <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl px-5 py-3.5 flex items-center gap-3 pr-8 min-w-[320px] sm:min-w-[380px]">
                {/* Cercle avec check vert */}
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                </div>

                {/* Texte */}
                <span className="text-xs font-semibold text-emerald-600">
                  Vos informations ont été enregistrées avec succès.
                </span>

                {/* Bouton rond vert avec croix blanche en haut à droite qui déborde */}
                <button
                  type="button"
                  onClick={() => setProfileSaved(false)}
                  className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* POPUP D'ERREUR STYLE IDENTIQUE */}
      {profileError && (
        <>
          <div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[9990] pointer-events-none animate-in fade-in duration-300"
            aria-hidden="true"
          />

          <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="text-sm font-bold text-rose-600 mb-1 pl-1">
              Erreur
            </div>

            <div className="relative">
              <div className="absolute -left-1.5 -bottom-1.5 inset-0 bg-rose-600 rounded-xs" />
              <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl px-5 py-3.5 flex items-center gap-3 pr-8 min-w-[320px] sm:min-w-[380px]">
                <div className="w-5 h-5 rounded-full border-2 border-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                </div>

                <span className="text-xs font-semibold text-rose-700">
                  {profileError}
                </span>

                <button
                  type="button"
                  onClick={() => setProfileError(null)}
                  className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {profileLoading && !profileData.employeeNumber ? (
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-12 text-center text-[#64748B] text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#FF7900]" />
          Chargement de votre dossier...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-6 sm:p-7 shadow-xs">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Informations Générales (Lecture seule / assignées par la direction) */}
            <div className="p-4 bg-[#F4F6F9] rounded-xl border border-[#DCE2EA]">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#062653] mb-3">
                Affectation & Données Officielles
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] font-semibold block">Matricule</span>
                  <span className="font-bold text-[#062653] font-mono mt-0.5 block">
                    {profileData.employeeNumber || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-semibold block">Succursale</span>
                  <span className="font-bold text-[#263445] mt-0.5 block">
                    {profileData.branch || "Siège Principal"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-semibold block">Poste / Rôle</span>
                  <span className="font-bold text-[#263445] mt-0.5 block">
                    {profileData.position || (
                      <span className="text-[#94A3B8] font-normal italic">Non renseigné</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-semibold block">Département</span>
                  <span className="font-bold text-[#263445] mt-0.5 block">
                    {profileData.department || (
                      <span className="text-[#94A3B8] font-normal italic">Non renseigné</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Coordonnées & Téléphone */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF7900] pb-1 border-b border-[#DCE2EA] mb-4">
                1. Coordonnées de Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Email de connexion (Non modifiable)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileData.email || ""}
                    className="w-full h-10 px-3 bg-slate-100 border border-[#DCE2EA] rounded-xl text-xs text-[#64748B] cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Numéro de téléphone (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileData.phone || ""}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+509 3000-0000"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 2. Informations Personnelles & Études */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF7900] pb-1 border-b border-[#DCE2EA] mb-4">
                2. Informations Personnelles & Études
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#263445]">
                      Date de naissance
                    </label>
                    {calculateAge(profileData.birthDate) !== null && (
                      <span className="text-[10px] font-bold text-[#FF7900] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                        Âge calculé : {calculateAge(profileData.birthDate)} ans
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={profileData.birthDate || ""}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Domaine d'étude
                  </label>
                  <input
                    type="text"
                    value={profileData.studyDomain || ""}
                    onChange={(e) => setProfileData({ ...profileData, studyDomain: e.target.value })}
                    placeholder="Ex: Comptabilité, Gestion, Informatique..."
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3. Santé & Dossier Médical */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF7900] pb-1 border-b border-[#DCE2EA] mb-4">
                3. Santé & Dossier Médical
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Groupe Sanguin
                  </label>
                  <select
                    value={profileData.bloodGroup || ""}
                    onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
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
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Maladie / Conditions médicales / Allergies
                  </label>
                  <input
                    type="text"
                    value={profileData.medicalNotes || ""}
                    onChange={(e) => setProfileData({ ...profileData, medicalNotes: e.target.value })}
                    placeholder="Ex: Asthme, Allergie pénicilline, Diabète (laisser vide si aucune)"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 4. Appel en Cas d'Urgence */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF7900] pb-1 border-b border-[#DCE2EA] mb-4">
                4. Appel en Cas d'Urgence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Personne à contacter (Nom complet)
                  </label>
                  <input
                    type="text"
                    value={profileData.emergencyContactName || ""}
                    onChange={(e) => setProfileData({ ...profileData, emergencyContactName: e.target.value })}
                    placeholder="Ex: Marie Joseph"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Relation / Lien de parenté
                  </label>
                  <input
                    type="text"
                    value={profileData.emergencyContactRelation || ""}
                    onChange={(e) => setProfileData({ ...profileData, emergencyContactRelation: e.target.value })}
                    placeholder="Ex: Épouse, Père, Frère, Proche..."
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#263445] mb-1.5">
                    Numéro de téléphone d'urgence
                  </label>
                  <input
                    type="tel"
                    value={profileData.emergencyContactPhone || ""}
                    onChange={(e) => setProfileData({ ...profileData, emergencyContactPhone: e.target.value })}
                    placeholder="Ex: +509 3000-0000"
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white focus:border-[#FF7900] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-[#DCE2EA] flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Enregistrement en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    Enregistrer mes informations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
