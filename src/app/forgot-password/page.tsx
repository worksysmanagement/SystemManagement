"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la demande.");
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError("Erreur réseau. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE2EA] shadow-xl p-8 sm:p-10 text-center">
        {/* Brand Header */}
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

        {submitted ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex justify-center mx-auto mb-1">
              <img
                src="/success-check.png"
                alt="Succès"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-xs"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#062653]">
                Vérifiez votre boîte e-mail
              </h1>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Si un compte existe pour l'adresse <strong className="text-slate-900">{email}</strong>, nous vous avons envoyé un lien pour réinitialiser votre mot de passe depuis <span className="font-semibold text-[#062653]">rkonekte509@gmail.com</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-[#062653]">Instructions :</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Le lien est sécurisé et valable pendant 1 heure.</li>
                <li>Pensez à vérifier vos courriers indésirables (spams) si nécessaire.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full h-11 bg-[#062653] hover:bg-[#0a3570] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-left animate-fadeIn">
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#062653]">
                Mot de passe oublié ?
              </h1>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Saisissez votre adresse e-mail professionnelle pour recevoir un lien sécurisé de réinitialisation.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#062653] mb-1.5">
                  Adresse e-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="directeur@mon-entreprise.com"
                    className="w-full h-11 pl-10 pr-3.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF7900] transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#FF7900]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#062653] hover:text-[#FF7900] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
