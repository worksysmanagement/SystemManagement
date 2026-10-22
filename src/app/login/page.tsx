"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PhoneCountryInput } from "@/components/ui/PhoneCountryInput";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const EMPLOYEE_RANGES = [
  "1 à 5 employés",
  "6 à 20 employés",
  "21 à 50 employés",
  "51 à 100 employés",
  "101 à 250 employés",
  "Plus de 250 employés",
];

const ROLES = [
  "Président Directeur Général (PDG)",
  "Fondateur / Propriétaire",
  "Directeur Général (DG) / Gérant",
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: "login" or "register"
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const resetSuccess = searchParams.get("reset") === "success";

  // Sync mode with URL if searchParams changes
  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setMode("register");
    }
  }, [searchParams]);

  // Switch handlers
  const handleSwitchToRegister = () => {
    setMode("register");
    setRegisterError(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login?mode=register");
    }
  };

  const handleSwitchToLogin = () => {
    setMode("login");
    setLoginError(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login");
    }
  };

  // ================= LOGIN STATE & HANDLERS =================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Identifiants invalides");
        return;
      }

      if (data.user?.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (data.user?.role === "EMPLOYEE" || data.user?.role === "COLLABORATEUR") {
        router.push("/admin/requests");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    } catch (err) {
      setLoginError("Erreur réseau lors de la connexion");
    } finally {
      setLoginLoading(false);
    }
  };

  // ================= REGISTER STATE & HANDLERS =================
  const [registerData, setRegisterData] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    address: "",
    employeeRange: "6 à 20 employés",
    applicantName: "",
    applicantRole: "Président Directeur Général (PDG)",
    // Honeypot anti-robot fields
    hp_website: "",
    hp_phone_trap: "",
  });

  const [formLoadTime, setFormLoadTime] = useState<number>(0);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, [mode]);

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);

    try {
      const res = await fetch("/api/public/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerData,
          formLoadTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegisterError(
          data.error || "Une erreur est survenue lors de l'inscription."
        );
        return;
      }

      setSubmissionResult(data);
      setRegisterSubmitted(true);
    } catch (err: any) {
      setRegisterError(
        "Erreur réseau. Veuillez vérifier votre connexion et réessayer."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4F6F9]">
      {/* ================= LEFT BRAND HERO PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 text-white relative flex-col justify-between p-8 xl:p-12 overflow-hidden select-none border-r border-[#0D3E82]/30 bg-[#071E3D] lg:sticky lg:top-0 lg:h-screen shrink-0">
        {/* Graphic Vector Background matching reference image */}
        <img
          src="/login-bg-pattern.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        />

        {/* --- Top Brand Logo --- */}
        <div className="relative z-10 pt-1">
          <img
            src="/logo-rk-emblem.png"
            alt="RKonekte"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* --- Hero Value Proposition --- */}
        <div className="relative z-10 mt-6 sm:mt-8 mb-auto py-2">
          <h1 className="font-script text-4xl sm:text-5xl xl:text-6xl text-white leading-tight mb-3 tracking-wide">
            Une gestion plus simple,
            <span className="block text-[#FF7900] mt-1">plus efficace.</span>
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed max-w-md mb-6">
            Centralisez, organisez et suivez toutes vos activités et demandes en un seul endroit.
          </p>

          {/* Feature Bullets with Custom Pure White Icons */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-4 text-white text-[15px] xl:text-base font-medium">
              <img
                src="/icons/feature-users.png"
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span>Gestion des utilisateurs</span>
            </div>

            <div className="flex items-center gap-4 text-white text-[15px] xl:text-base font-medium">
              <img
                src="/icons/feature-projects.png"
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span>Suivi des projets & congés</span>
            </div>

            <div className="flex items-center gap-4 text-white text-[15px] xl:text-base font-medium">
              <img
                src="/icons/feature-tasks.png"
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span>Tâches et productivité</span>
            </div>

            <div className="flex items-center gap-4 text-white text-[15px] xl:text-base font-medium">
              <img
                src="/icons/feature-reports.png"
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span>Rapports et analyses</span>
            </div>
          </div>
        </div>

        {/* --- Bottom Footer Info --- */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center text-xs text-white">
          <span className="text-white font-medium">© 2026 RKonekte</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL (LOGIN OR REGISTER) ================= */}
      <div className="w-full lg:w-1/2 xl:w-7/12 min-h-screen flex items-center justify-center p-6 sm:p-8 lg:p-10 py-10 sm:py-12 relative bg-[#F8FAFC] overflow-y-auto">
        <div
          className={`w-full ${
            mode === "register" ? "max-w-[760px] p-7 sm:p-9" : "max-w-[440px] p-6 sm:p-10"
          } bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 relative z-10 transition-all duration-200 my-auto`}
        >
          {/* ================= MODE: LOGIN ================= */}
          {mode === "login" && (
            <div className="animate-fadeIn">
              {/* Header Card with Official Logo */}
              <div className="flex flex-col items-center justify-center mb-8 text-center">
                <img
                  src="/logo-rkonekte.png"
                  alt="RKonekte"
                  className="h-13 sm:h-14 w-auto object-contain mb-2.5"
                />
                <p className="text-[11px] font-bold tracking-[0.25em] text-[#64748B] uppercase">
                  GESTION DIGITALISÉE
                </p>
              </div>

              {/* Reset Success Message */}
              {resetSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.</span>
                </div>
              )}

              {/* Error Message */}
              {loginError && (
                <div className="mb-4 text-rose-600 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username / Email Input */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nom d'utilisateur ou e-mail"
                      className="w-full h-12 pl-11 pr-4 bg-[#F8FAFC] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none font-medium"
                    />
                    <User className="w-4 h-4 text-[#091A30] absolute left-4 top-4" />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                      className="w-full h-12 pl-11 pr-11 bg-[#F8FAFC] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none font-medium"
                    />
                    <Lock className="w-4 h-4 text-[#091A30] absolute left-4 top-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors focus:outline-none"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox & Forgot Password Link */}
                <div className="flex items-center justify-between pt-1 pb-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#091A30] accent-[#091A30] focus:ring-[#091A30] border-slate-300 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                    >
                      Se souvenir de moi
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#FF6B00] hover:text-[#E05E00] hover:underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit Orange Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 bg-[#FF6B00] hover:bg-[#E05E00] active:scale-[0.99] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all flex items-center justify-center cursor-pointer mt-2"
                >
                  {loginLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Se connecter</span>
                  )}
                </button>
              </form>

              {/* Toggle to Registration Form */}
              <div className="mt-8 pt-5 border-t border-[#DCE2EA] text-center">
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="text-sm font-semibold text-[#64748B] hover:text-[#062653] transition-colors cursor-pointer"
                >
                  Nouvelle entreprise ? S'inscrire ici
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE: REGISTER ================= */}
          {mode === "register" && (
            <div className="animate-fadeIn">
              {/* Header Branding */}
              <div className="text-center mb-5">
                <div className="flex flex-col items-center justify-center text-center">
                  <img
                    src="/logo-rkonekte.png"
                    alt="RKonekte"
                    className="h-13 sm:h-14 w-auto object-contain mb-2.5"
                  />
                  <p className="text-xs font-bold tracking-[0.25em] text-[#64748B] uppercase">
                    GESTION DIGITALISÉE
                  </p>
                </div>
              </div>

              {registerSubmitted ? (
                /* Success View - Clean & Simple */
                <div className="text-center py-6 space-y-4 animate-fadeIn">
                  <div className="flex justify-center mx-auto mb-1">
                    <img
                      src="/success-check.png"
                      alt="Succès"
                      className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#062653]">
                      Votre compte a été enregistré avec succès !
                    </h3>
                    <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                      Un e-mail a été envoyé à <strong className="text-[#062653] font-bold">{registerData.companyEmail}</strong>.
                    </p>
                    <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed pt-1">
                      Veuillez vérifier votre boîte de réception (et vos courriers indésirables / spams) et cliquer sur le bouton présent dans le mail pour définir votre mot de passe et activer votre compte.
                    </p>
                  </div>

                  <div className="pt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterSubmitted(false);
                        handleSwitchToLogin();
                      }}
                      className="px-6 py-3 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      J'ai déjà un compte / Se connecter
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {/* Invisible Anti-Robot Honeypot Fields */}
                  <div
                    aria-hidden="true"
                    style={{
                      display: "none",
                      position: "absolute",
                      left: "-9999px",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  >
                    <input
                      type="text"
                      name="hp_website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={registerData.hp_website}
                      onChange={handleRegisterChange}
                    />
                    <input
                      type="text"
                      name="hp_phone_trap"
                      tabIndex={-1}
                      autoComplete="off"
                      value={registerData.hp_phone_trap}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  {registerError && (
                    <div className="text-rose-600 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  {/* Section 1: Informations de l'Entreprise */}
                  <div>
                    <h3 className="text-sm font-bold text-[#FF7900] uppercase tracking-wider mb-2">
                      1. Informations de l'entreprise
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Nom de l'entreprise */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Nom de l'entreprise <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          required
                          value={registerData.companyName}
                          onChange={handleRegisterChange}
                          placeholder="Ex: Carib Tech Solutions S.A."
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-medium text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors"
                        />
                      </div>

                      {/* Email de l'entreprise */}
                      <div>
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Email de l'entreprise <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="companyEmail"
                          required
                          value={registerData.companyEmail}
                          onChange={handleRegisterChange}
                          placeholder="contact@entreprise.com"
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-medium text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block leading-tight italic">
                          Un email direct sera envoyé à cette adresse pour valider l'enregistrement.
                        </span>
                      </div>

                      {/* Numéro de téléphone avec sélecteur de pays */}
                      <div>
                        <PhoneCountryInput
                          label="Numéro de téléphone *"
                          value={registerData.phone}
                          onChange={(val) =>
                            setRegisterData((prev) => ({ ...prev, phone: val }))
                          }
                          required
                        />
                      </div>

                      {/* Adresse physique */}
                      <div>
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Adresse physique <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          value={registerData.address}
                          onChange={handleRegisterChange}
                          placeholder="Ex: 14, Rue Panaméricaine, Pétion-Ville"
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-medium text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors"
                        />
                      </div>

                      {/* Nombre d'employés */}
                      <div>
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Nombre d'employés (Intervalle) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="employeeRange"
                          required
                          value={registerData.employeeRange}
                          onChange={handleRegisterChange}
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-semibold text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors cursor-pointer"
                        >
                          {EMPLOYEE_RANGES.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Responsable de l'enregistrement */}
                  <div className="pt-2.5 border-t border-[#DCE2EA]">
                    <h3 className="text-sm font-bold text-[#FF7900] uppercase tracking-wider mb-2">
                      2. Responsable de l'enregistrement
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Nom et prénom */}
                      <div>
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Nom et prénom du déclarant <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="applicantName"
                          required
                          value={registerData.applicantName}
                          onChange={handleRegisterChange}
                          placeholder="Ex: Piton Rodjensky Emmanuel"
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-medium text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors"
                        />
                      </div>

                      {/* Rôle dans l'entreprise */}
                      <div>
                        <label className="block text-xs sm:text-[13px] font-semibold text-[#263445] mb-1">
                          Rôle dans l'entreprise <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="applicantRole"
                          required
                          value={registerData.applicantRole}
                          onChange={handleRegisterChange}
                          className="w-full h-10 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-sm font-semibold text-[#263445] focus:bg-white focus:border-[#FF7900] outline-none transition-colors cursor-pointer"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-5 pb-1 border-t border-[#DCE2EA] flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-sm font-semibold text-[#64748B] hover:text-[#062653] transition-colors cursor-pointer"
                    >
                      J'ai déjà un compte
                    </button>

                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="px-9 h-12 bg-[#FF7900] hover:bg-[#E66D00] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#FF7900]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {registerLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>S'inscrire</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
