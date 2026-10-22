"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
} from "lucide-react";

function VerifyCompanyContent() {
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
  const [activated, setActivated] = useState(false);

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

  // 1. Check token validity on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Aucun jeton de validation n'a été fourni dans le lien.");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/public/verify-company?token=${encodeURIComponent(token!)}`);
        const result = await res.json();
        if (!res.ok) {
          setError(result.error || "Lien d'activation invalide ou expiré.");
          return;
        }
        setTokenData(result);
        if (result.alreadyActivated) {
          setActivated(true);
        }
      } catch (err) {
        setError("Erreur réseau lors de la vérification du lien.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // 2. Handle password creation and account activation
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isConforme) {
      const missing: string[] = [];
      if (!hasMinLength) missing.push("au moins 8 caractères");
      if (!hasUppercase) missing.push("une majuscule (A-Z)");
      if (!hasLowercase) missing.push("une minuscule (a-z)");
      if (!hasNumber) missing.push("un chiffre (0-9)");
      if (!hasSpecial) missing.push("un caractère spécial (!@#$%^&*...)");
      setFormError(`Le mot de passe doit comporter : ${missing.join(", ")}.`);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/public/verify-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Une erreur est survenue lors de l'activation.");
        return;
      }

      setActivated(true);

      // Auto redirect to dashboard after 1.5s
      setTimeout(() => {
        router.push(data.redirectUrl || "/admin/dashboard");
      }, 1500);
    } catch (err: any) {
      setFormError("Erreur réseau. Veuillez vérifier votre connexion et réessayer.");
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
              Vérification du lien d'activation...
            </h2>
            <p className="text-xs text-[#64748B]">
              Veuillez patienter un instant.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-rose-900">
              Lien invalide ou expiré
            </h1>

            <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
              {error}
            </p>

            <div className="pt-4 space-y-2">
              <Link
                href="/login?mode=register"
                className="block w-full py-2.5 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Recommencer l'inscription
              </Link>
              <Link
                href="/login"
                className="block text-xs font-semibold text-[#062653] hover:underline pt-2"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        )}

        {/* SUCCESS STATE (ACTIVATED) */}
        {!loading && !error && activated && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-center mx-auto mb-1">
              <img
                src="/success-check.png"
                alt="Succès"
                className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#062653]">
              Compte activé avec succès !
            </h1>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Votre mot de passe administrateur est configuré. Vous disposez de l'ensemble des accès pour gérer{" "}
              <strong className="text-[#062653]">{tokenData?.companyName}</strong>.
            </p>

            <div className="py-2">
              <div className="inline-flex items-center gap-2 text-xs text-[#FF7900] font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirection vers votre tableau de bord...</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/dashboard"
                className="w-full h-11 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Accéder immédiatement à l'espace</span>
                <ArrowRight className="w-4 h-4 text-[#FF7900]" />
              </Link>
            </div>
          </div>
        )}

        {/* FORM STATE: SET PASSWORD */}
        {!loading && !error && !activated && tokenData && (
          <div className="space-y-5 text-left animate-fadeIn">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 inline-block mb-1">
                Activation du compte administrateur
              </span>
              <h1 className="text-xl font-bold text-[#062653] mt-2">
                Définissez votre mot de passe
              </h1>
            </div>

            {/* Company & Role Summary */}
            <div className="bg-transparent border border-[#DCE2EA] rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Entreprise :</span>
                <span className="font-bold text-[#062653]">{tokenData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email administrateur :</span>
                <span className="font-semibold text-slate-800">{tokenData.companyEmail}</span>
              </div>
              <div className="pt-1 text-[11px] text-emerald-700 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Accès complet aux opérations de l'entreprise</span>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4">
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
                    className="w-full h-11 pl-3.5 pr-10 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#062653] transition-colors"
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
                  Confirmer le mot de passe <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className="w-full h-11 px-3.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#062653] transition-colors"
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF7900]" />
                    <span>Activation en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Activer mon compte et accéder à l'espace</span>
                    <ArrowRight className="w-4 h-4 text-[#FF7900]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyCompanyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FF7900] animate-spin" />
        </div>
      }
    >
      <VerifyCompanyContent />
    </Suspense>
  );
}
