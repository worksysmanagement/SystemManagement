"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, AlertCircle, RefreshCw, Building2, Mail, Loader2, ShieldCheck } from "lucide-react";

interface OnboardingRequest {
  id: string;
  companyName: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  adminName: string;
  adminEmail: string;
  applicantName?: string;
  companyEmail?: string;
  applicantRole?: string;
  employeeRange?: string;
  emailVerified?: boolean;
  passwordSet?: boolean;
  hasPassword?: boolean;
  tempPassword?: string;
  city: string;
  estimatedEmployees: string;
  message: string;
  submittedAt: number;
}

export default function SuperAdminOnboardingRequestsPage() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    credentials?: { companyName: string; email: string; tempPassword: string };
  } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/super-admin/onboarding-requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load onboarding requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResendActivation = async (organizationId: string) => {
    setResendingId(organizationId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/super-admin/organizations/${organizationId}/resend-activation`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Erreur lors du renvoi de l'email" });
        return;
      }

      setFeedback({
        type: "success",
        text: data.message || "Nouveau lien d'activation envoyé avec succès. L'ancien lien a été révoqué.",
      });
      loadRequests();
    } catch (err) {
      setFeedback({ type: "error", text: "Erreur réseau lors du renvoi de l'email." });
    } finally {
      setResendingId(null);
    }
  };

  const handleDecision = async (organizationId: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !confirm("Êtes-vous certain de vouloir refuser cette demande ?")) {
      return;
    }

    setProcessingId(organizationId);
    setFeedback(null);

    try {
      const res = await fetch("/api/super-admin/onboarding-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Erreur lors du traitement" });
        return;
      }

      setFeedback({
        type: "success",
        text: action === "APPROVE" ? "Entreprise activée avec succès !" : "Demande rejetée.",
        credentials: data.credentials,
      });
      loadRequests();
    } catch (err) {
      setFeedback({ type: "error", text: "Erreur réseau lors de la validation." });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Demandes d'Adhésion en Ligne
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Entreprises ayant soumis une demande via le formulaire public en ligne.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-[#DCE2EA] hover:bg-slate-50 text-xs font-semibold text-[#263445] rounded-xl flex items-center gap-2 self-start transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium space-y-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>

          {feedback.credentials && (
            <div className="mt-2 bg-white/90 border border-emerald-200 rounded-lg p-3 text-xs space-y-1.5 font-sans shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                Identifiants d'accès créés pour l'administrateur :
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Entreprise : </span>
                  <strong className="text-[#062653]">{feedback.credentials.companyName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email : </span>
                  <strong className="text-[#062653] font-mono">{feedback.credentials.email}</strong>
                </div>
                {feedback.credentials.tempPassword && (
                  <div>
                    <span className="text-slate-500 font-medium">Mot de passe temporaire : </span>
                    <strong className="text-[#FF7900] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-mono">
                      {feedback.credentials.tempPassword}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Requests List Card */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">Chargement des demandes...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Aucune demande d'adhésion en attente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3.5">Entreprise</th>
                  <th className="px-5 py-3.5">Responsable</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Effectif</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#062653] text-sm">{req.companyName}</div>
                      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">slug: {req.slug}</div>
                      {req.message && (
                        <div className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 max-w-xs">
                          « {req.message} »
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#263445]">{req.applicantName || req.adminName}</div>
                      <div className="text-[11px] font-bold text-[#FF7900]">{req.applicantRole || "Responsable"}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">{req.companyEmail || req.adminEmail}</div>
                      {req.tempPassword && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Pass : <code className="bg-slate-100 px-1 py-0.5 rounded text-[#062653] font-semibold">{req.tempPassword}</code>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#263445]">{req.phone}</div>
                      <div className="text-[11px] text-[#64748B] truncate max-w-[180px]">{req.address || req.city}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-1 bg-[#F4F6F9] border border-[#DCE2EA] rounded-md text-[11px] font-semibold text-[#263445]">
                        {req.employeeRange || req.estimatedEmployees || "Non précisé"}
                      </span>
                      <div className="mt-1.5 flex flex-col gap-1">
                        {req.hasPassword || req.passwordSet ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Mot de passe configuré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            En attente de mot de passe
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-[#64748B]">
                      {new Date(req.submittedAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(!req.hasPassword && !req.passwordSet) && (
                          <button
                            onClick={() => handleResendActivation(req.id)}
                            disabled={resendingId === req.id || processingId === req.id}
                            className="px-3 py-1.5 bg-[#062653] hover:bg-[#083370] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            title="Renvoyer l'e-mail d'activation (invalide immédiatement l'ancien lien)"
                          >
                            {resendingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5 text-[#FF7900]" />
                            )}
                            Renvoyer le mail
                          </button>
                        )}
                        <button
                          onClick={() => handleDecision(req.id, "APPROVE")}
                          disabled={processingId === req.id || resendingId === req.id}
                          className="px-3 py-1.5 bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleDecision(req.id, "REJECT")}
                          disabled={processingId === req.id || resendingId === req.id}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
