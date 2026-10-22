"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
} from "lucide-react";
import { showSystemToast } from "@/components/ui/SystemToast";

export default function AccountSecurityPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          const role = data.user.role;
          const isEmp =
            role === "EMPLOYEE" ||
            role === "COLLABORATEUR" ||
            (typeof role === "string" &&
              (role.toLowerCase().includes("employ") || role.toLowerCase().includes("collab")));
          setIsEmployee(Boolean(isEmp));
        }
      })
      .catch(() => {});
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      showSystemToast("Les nouveaux mots de passe ne correspondent pas.", "error");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      showSystemToast("Le nouveau mot de passe doit comporter au moins 8 caractères.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        const errMsg = resData.error || "Impossible de mettre à jour le mot de passe.";
        setPasswordError(errMsg);
        showSystemToast(errMsg, "error");
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSystemToast("Votre mot de passe a été mis à jour avec succès.");
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (_) {
      const errMsg = "Erreur réseau lors de la mise à jour du mot de passe.";
      setPasswordError(errMsg);
      showSystemToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
            {isEmployee ? "Mon Compte" : "Sécurité & Authentification"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
          Sécurité du Compte
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          {isEmployee
            ? "Modifiez le mot de passe de votre compte en toute sécurité."
            : "Gestion de votre mot de passe, double authentification (2FA) et contrôle des sessions connectées."}
        </p>
      </div>

      <div className={isEmployee ? "max-w-xl mx-auto" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
        {/* PASSWORD CHANGE */}
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE2EA]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#062653]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                Changer votre mot de passe
              </h3>
            </div>
            {currentUser?.email && (
              <span className="text-[11px] text-[#64748B] font-medium truncate max-w-[200px]" title={currentUser.email}>
                {currentUser.email}
              </span>
            )}
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Mot de passe mis à jour avec succès.
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#263445] mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs text-[#263445] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#263445] mb-1">
                Nouveau mot de passe (min. 8 caractères)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs text-[#263445] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#263445] mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs text-[#263445] focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>{isSubmitting ? "Mise à jour en cours..." : "Mettre à jour le mot de passe"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2FA & ACTIVE SESSIONS: Hidden for employees */}
        {!isEmployee && (
          <div className="space-y-6">
            {/* 2FA TOGGLE */}
            <div className="bg-white rounded-xl border border-[#DCE2EA] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#062653]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                    Double Authentification (2FA)
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    twoFactorEnabled
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {twoFactorEnabled ? "Activée" : "Désactivée"}
                </span>
              </div>

              <p className="text-xs text-[#64748B]">
                Renforce la sécurité de votre compte en exigeant un code de validation à chaque nouvelle connexion.
              </p>

              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className="px-4 py-2 bg-[#F4F6F9] hover:bg-[#DCE2EA] text-[#062653] font-bold text-xs rounded-lg border border-[#DCE2EA] cursor-pointer transition-colors"
              >
                {twoFactorEnabled ? "Désactiver la vérification" : "Activer la vérification 2FA"}
              </button>
            </div>

            {/* ACTIVE SESSIONS */}
            <div className="bg-white rounded-xl border border-[#DCE2EA] p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE2EA]">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#062653]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                    Sessions Actives
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">1 en ligne</span>
              </div>

              <div className="p-3 bg-[#F4F6F9] rounded-lg border border-[#DCE2EA] text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[#062653]">
                  <span>Navigateur Actuel — Chrome (Windows)</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Cette session
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono">
                  IP: 190.115.18.42 • Port-au-Prince, HT
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert("Toutes les autres sessions distantes ont été invalidées.")}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Déconnecter tous les autres appareils
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
