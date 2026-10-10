"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Users,
  FolderKanban,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Identifiants invalides");
        return;
      }

      if (data.user?.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError("Erreur réseau lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4F6F9] overflow-hidden">
      {/* ================= LEFT BRAND HERO PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-[#091A30] text-white relative flex-col justify-between p-10 xl:p-14 overflow-hidden select-none">
        {/* Decorative Top-Left Orange Arc */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full border-[18px] border-[#FF6B00] pointer-events-none opacity-90" />
        
        {/* Decorative Bottom-Left Orange Arc */}
        <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full border-[20px] border-[#FF6B00] pointer-events-none opacity-90" />

        {/* Subtle Ambient Background Gradient & Architecture Illustration Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#091A30]/60 via-[#061224]/80 to-[#030914] pointer-events-none" />
        
        {/* Background Building Silhouette Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" 
        />

        {/* --- Top Brand Title --- */}
        <div className="relative z-10 pt-2">
          <div className="inline-block">
            <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white">
              Work Management System
            </h2>
            <p className="text-[11px] font-bold tracking-[0.28em] text-slate-300 uppercase mt-1">
              SYSTÈME DE GESTION
            </p>
          </div>
        </div>

        {/* --- Center Hero Value Proposition --- */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            Une gestion plus simple,
            <span className="block text-[#FF6B00] font-black mt-1">plus efficace.</span>
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed max-w-md mb-8">
            Centralisez, organisez et suivez toutes vos activités et demandes en un seul endroit.
          </p>

          {/* Feature Bullets with Icons */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 text-slate-200 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] shrink-0">
                <Users className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <span>Gestion des utilisateurs</span>
            </div>

            <div className="flex items-center gap-3.5 text-slate-200 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] shrink-0">
                <FolderKanban className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <span>Suivi des projets & congés</span>
            </div>

            <div className="flex items-center gap-3.5 text-slate-200 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <span>Tâches et productivité</span>
            </div>

            <div className="flex items-center gap-3.5 text-slate-200 text-sm font-medium">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] shrink-0">
                <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <span>Rapports et analyses</span>
            </div>
          </div>
        </div>

        {/* --- Bottom Footer Info --- */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Work Management System</span>
          <span className="text-slate-500">Plateforme Sécurisée</span>
        </div>
      </div>

      {/* ================= RIGHT LOGIN FORM PANEL ================= */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex items-center justify-center p-6 sm:p-10 relative bg-[#F8FAFC]">
        {/* Decorative Bottom-Right Orange Arc */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full border-[18px] border-[#FF6B00] pointer-events-none opacity-90 hidden sm:block" />

        <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8 sm:p-10 relative z-10">
          {/* Header Title on Card (No Logo) */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091A30] tracking-tight">
              Work Management System
            </h2>
            <p className="text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-1.5">
              SYSTÈME DE GESTION
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-1 pb-2">
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

            {/* Submit Orange Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#FF6B00] hover:bg-[#E05E00] active:scale-[0.99] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Public Form Link */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors"
            >
              ← Retour au formulaire de demande de congé
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

