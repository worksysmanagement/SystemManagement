"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
} from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password evaluation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isConforme = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const criteriaCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const passwordStrengthScore =
    password.length === 0
      ? 0
      : isConforme
      ? 4
      : criteriaCount >= 4
      ? 3
      : criteriaCount === 3
      ? 2
      : 1;

  // 1. Verify token on load
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Aucun jeton de réinitialisation n'a été fourni dans le lien.");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token!)}`);
        const result = await res.json();
        if (!res.ok) {
          setError(result.error || "Ce lien de réinitialisation est invalide ou expiré.");
          return;
        }
        setTokenData(result);
      } catch (err) {
        setError("Erreur réseau lors de la vérification du lien.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // 2. Submit new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setFormError("Le mot de passe doit comporter au moins une lettre majuscule (A-Z).");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setFormError("Le mot de passe doit comporter au moins une lettre minuscule (a-z).");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setFormError("Le mot de passe doit comporter au moins un chiffre (0-9).");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setFormError("Le mot de passe doit comporter au moins un caractère spécial (!@#$%^&*...).");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Erreur lors de la mise à jour du mot de passe.");
        return;
      }

      setSuccess(true);

      // Auto redirect to dashboard or login
      setTimeout(() => {
        router.push(data.redirectUrl || "/login?reset=success");
      }, 1500);
    } catch (err) {
      setFormError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE2EA] shadow-xl p-8 sm:p-10 text-center">
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <img
            src="/logo-rkonekte.png"
            alt="RKonekte"
            className="h-10 w-auto object-contain mb-2"
          />
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#64748B] uppercase">
            GESTION DIGITALISÉE
          </p>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-[#FF7900] animate-spin mx-auto" />
            <h2 className="text-base font-bold text-[#062653]">
              Vérification du lien de réinitialisation...
            </h2>
            <p className="text-xs text-[#64748B]">
              Veuillez patienter un instant.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="space-y-5 animate-fadeIn">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#062653]">
                Lien invalide ou expiré
              </h2>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/forgot-password"
                className="w-full h-11 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Demander un nouveau lien de réinitialisation
              </Link>
              <Link
                href="/login"
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!loading && !error && success && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex justify-center mx-auto mb-1">
              <img
                src="/success-check.png"
                alt="Succès"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-xs"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#062653]">
                Mot de passe mis à jour !
              </h2>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Votre nouveau mot de passe a été enregistré avec succès. Vous allez être redirigé vers votre espace...
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full h-11 bg-[#062653] hover:bg-[#0a3570] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Accéder immédiatement à l'espace</span>
                <ArrowRight className="w-4 h-4 text-[#FF7900]" />
              </Link>
            </div>
          </div>
        )}

        {/* FORM STATE: NEW PASSWORD */}
        {!loading && !error && !success && tokenData && (
          <div className="space-y-5 text-left animate-fadeIn">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900]">
                Réinitialisation sécurisée
              </span>
              <h1 className="text-xl font-bold text-[#062653] mt-2">
                Nouveau mot de passe
              </h1>
              <p className="text-xs text-[#64748B] mt-1">
                Choisissez un mot de passe fort pour sécuriser votre compte.
              </p>
            </div>

            {/* Account Summary */}
            <div className="bg-transparent border border-[#DCE2EA] rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Compte :</span>
                <span className="font-semibold text-slate-800">{tokenData.email}</span>
              </div>
              {tokenData.userName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Utilisateur :</span>
                  <span className="font-bold text-[#062653]">{tokenData.userName}</span>
                </div>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#062653] mb-1.5">
                  Nouveau mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 car., Maj, Min, Chiffre, Caractère spécial"
                    className="w-full h-11 pl-3.5 pr-10 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF7900] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Barre d'évaluation fixe (ne redimensionne pas la boîte) */}
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-200 ${
                        passwordStrengthScore >= 1
                          ? passwordStrengthScore === 1
                            ? "bg-rose-500"
                            : passwordStrengthScore === 2
                            ? "bg-amber-500"
                            : passwordStrengthScore === 3
                            ? "bg-sky-500"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-200 ${
                        passwordStrengthScore >= 2
                          ? passwordStrengthScore === 2
                            ? "bg-amber-500"
                            : passwordStrengthScore === 3
                            ? "bg-sky-500"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-200 ${
                        passwordStrengthScore >= 3
                          ? passwordStrengthScore === 3
                            ? "bg-sky-500"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-200 ${
                        passwordStrengthScore >= 4 ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] h-4 leading-none">
                    <span className="text-slate-400">Force du mot de passe</span>
                    <span
                      className={`font-semibold transition-colors ${
                        passwordStrengthScore === 0
                          ? "text-slate-400 font-normal"
                          : passwordStrengthScore === 1
                          ? "text-rose-500"
                          : passwordStrengthScore === 2
                          ? "text-amber-500"
                          : passwordStrengthScore === 3
                          ? !hasSpecial
                            ? "text-amber-600 font-bold"
                            : "text-sky-600"
                          : "text-emerald-600 font-bold"
                      }`}
                    >
                      {passwordStrengthScore === 0
                        ? "8+ car., Maj, Min, Chiffre, Car. spécial"
                        : passwordStrengthScore === 1
                        ? "Très faible"
                        : passwordStrengthScore === 2
                        ? "Moyen"
                        : passwordStrengthScore === 3
                        ? !hasSpecial
                          ? "Caractère spécial requis (!@#...)"
                          : "Bon"
                        : "Fort (conforme)"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#062653] mb-1.5">
                  Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className="w-full h-11 px-3.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF7900] transition-colors"
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || (confirmPassword.length > 0 && password !== confirmPassword)}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mise à jour en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Enregistrer mon nouveau mot de passe</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#062653] hover:text-[#FF7900] transition-colors"
              >
                Annuler et revenir à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FF7900] animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
