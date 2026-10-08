"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DecisionModal } from "@/components/admin/DecisionModal";
import { AuditTimeline } from "@/components/admin/AuditTimeline";

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [request, setRequest] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [postDecisionWhatsAppUrl, setPostDecisionWhatsAppUrl] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/requests/${id}`);
      if (!res.ok) {
        setError("Demande de congé introuvable ou accès refusé.");
        return;
      }
      const data = await res.json();
      setRequest(data.request);
      setAuditLogs(data.auditLogs || []);
      setNotifications(data.notifications || []);
    } catch (err) {
      setError("Erreur réseau lors du chargement de la demande.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDecision = async ({
    rejectionReason,
    comment,
  }: {
    rejectionReason?: string;
    comment?: string;
  }) => {
    const endpoint =
      modalType === "APPROVE"
        ? `/api/admin/requests/${id}/approve`
        : `/api/admin/requests/${id}/reject`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionReason,
        decisionComment: comment,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Impossible d'enregistrer la décision");
    }

    setActionSuccess(
      modalType === "APPROVE"
        ? "La demande a été approuvée avec succès !"
        : "La demande a été refusée."
    );

    // Automatically prepare WhatsApp notification link for employee and launch it immediately
    if (request?.contactPhone) {
      const waText =
        modalType === "APPROVE"
          ? `Bonjour ${request.firstName},\n\nVotre demande de congé ${request.requestNumber} a été APPROUVÉE.\n\nDate de début : ${request.startDate}\nDate de fin : ${request.endDate}\n\nConsulter votre demande et voir le verdict :\n${window.location.origin}/request/${request.employeeAccessTokenHash}`
          : `Bonjour ${request.firstName},\n\nVotre demande de congé ${request.requestNumber} a été REFUSÉE.\n\nMotif : ${rejectionReason || "Non précisé"}\n\nConsulter votre demande et voir le verdict :\n${window.location.origin}/request/${request.employeeAccessTokenHash}`;
      
      const cleanPhone = request.contactPhone.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
      
      // Automatic trigger: open WhatsApp immediately in a new tab upon confirmation
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
      
      setPostDecisionWhatsAppUrl(waUrl);
    }

    setTimeout(() => setActionSuccess(null), 5000);
    await loadData();
  };

  const handleResendNotification = async () => {
    setResending(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/resend-notification`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess("Notification renvoyée avec succès !");
        setTimeout(() => setActionSuccess(null), 4000);
        await loadData();
      } else {
        alert(data.error || "Échec du renvoi de la notification");
      }
    } catch (err) {
      alert("Erreur lors du renvoi");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Chargement de la demande...</div>;
  }

  if (error || !request) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-rose-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Erreur</h2>
        <p className="text-sm text-slate-600 mt-1">{error || "Demande introuvable"}</p>
        <Link
          href="/admin/requests"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux demandes
        </Link>
      </div>
    );
  }

  const isPending = request.status === "PENDING";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-slate-900">
              {request.requestNumber}
            </h1>
            <StatusBadge status={request.status} size="md" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          {request.contactPhone && (
            <a
              href={`https://wa.me/${request.contactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                request.status === "APPROVED"
                  ? `Bonjour ${request.firstName},\n\nVotre demande de congé ${request.requestNumber} a été APPROUVÉE.\n\nDate de début : ${request.startDate}\nDate de fin : ${request.endDate}\n\nConsulter votre demande :\n${typeof window !== "undefined" ? window.location.origin : ""}/request/${request.employeeAccessTokenHash}`
                  : request.status === "REJECTED"
                  ? `Bonjour ${request.firstName},\n\nVotre demande de congé ${request.requestNumber} a été REFUSÉE.\n\nMotif : ${request.rejectionReason || "Non précisé"}\n\nConsulter votre demande :\n${typeof window !== "undefined" ? window.location.origin : ""}/request/${request.employeeAccessTokenHash}`
                  : `Bonjour ${request.firstName},\n\nVotre demande de congé ${request.requestNumber} est bien reçue et en cours de traitement.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              title="Ouvrir WhatsApp sur cet appareil avec le message pré-rempli"
            >
              <Phone className="w-4 h-4 text-slate-700" />
              Notifier sur WhatsApp
            </a>
          )}

          {isPending ? (
            <>
              <button
                onClick={() => setModalType("REJECT")}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Refuser
              </button>
              <button
                onClick={() => setModalType("APPROVE")}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approuver
              </button>
            </>
          ) : (
            <button
              onClick={handleResendNotification}
              disabled={resending}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              Relancer Cloud
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-slate-700 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* REJECTION NOTICE BANNER */}
      {request.status === "REJECTED" && (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Demande Refusée</h3>
              <p className="text-xs text-slate-700 mt-1">
                <strong>Motif :</strong> {request.rejectionReason}
              </p>
              {request.decisionComment && (
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Commentaire interne :</strong> {request.decisionComment}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN REQUEST DETAILS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: EMPLOYEE INFO SNAPSHOT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Informations sur l'employé (Snapshot)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400">Nom & Prénom</span>
                <span className="font-semibold text-slate-800">
                  {request.firstName} {request.lastName}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">N° d'Employé</span>
                <span className="font-mono font-medium text-slate-800">
                  {request.employeeNumber}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Département</span>
                <span className="font-medium text-slate-800">{request.department}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Poste</span>
                <span className="font-medium text-slate-800">{request.position}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: LEAVE DETAILS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Détails du congé
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
              <div>
                <span className="block text-xs text-slate-400">Type de congé</span>
                <span className="font-semibold text-slate-800">
                  {request.leaveType === "ANNUAL"
                    ? "Congé Annuel"
                    : request.leaveType === "SICK"
                    ? "Congé Maladie"
                    : request.leaveType === "UNPAID"
                    ? "Congé Sans Solde"
                    : request.leaveType === "MATERNITY_PATERNITY"
                    ? "Maternité / Paternité"
                    : `Autre (${request.leaveTypeOther})`}
                </span>
              </div>

              <div>
                <span className="block text-xs text-slate-400">Période</span>
                <span className="font-medium text-slate-800">
                  Du {request.startDate} au {request.endDate}
                </span>
              </div>

              <div>
                <span className="block text-xs text-slate-400">Nombre de jours</span>
                <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md border border-slate-200">
                  {request.requestedDays} jour(s)
                </span>
              </div>

              <div>
                <span className="block text-xs text-slate-400">Remplaçant proposé</span>
                <span className="text-slate-800 font-medium">
                  {request.replacementName || "Aucun remplaçant désigné"}
                </span>
              </div>

              <div>
                <span className="block text-xs text-slate-400">Téléphone de contact</span>
                <span className="font-mono text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {request.contactPhone}
                </span>
              </div>

              <div>
                <span className="block text-xs text-slate-400">Email de contact</span>
                <span className="text-slate-800 truncate flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {request.contactEmail || "Non renseigné"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AUDIT TIMELINE & NOTIFICATION LOGS (1 COL) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 h-fit">
          <AuditTimeline auditLogs={auditLogs} notifications={notifications} />
        </div>
      </div>

      {/* DECISION MODAL */}
      {modalType && (
        <DecisionModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          type={modalType}
          requestNumber={request.requestNumber}
          employeeName={`${request.firstName} ${request.lastName}`}
          onConfirm={handleDecision}
        />
      )}

      {/* POST-DECISION WHATSAPP PROMPT MODAL */}
      {postDecisionWhatsAppUrl && (
        <Modal
          isOpen={!!postDecisionWhatsAppUrl}
          onClose={() => setPostDecisionWhatsAppUrl(null)}
          title="Notification WhatsApp de l'employé"
        >
          <div className="space-y-4 text-center p-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 border border-slate-200 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Transmission automatique par WhatsApp
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                La fenêtre WhatsApp s'est ouverte automatiquement avec le verdict et le lien sécurisé pour <strong>{request.firstName} {request.lastName}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Si la fenêtre ne s'est pas ouverte (bloqueur de pop-up), cliquez sur le bouton ci-dessous :
              </p>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <a
                href={postDecisionWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPostDecisionWhatsAppUrl(null)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Envoyer le verdict par WhatsApp
              </a>

              <button
                type="button"
                onClick={() => setPostDecisionWhatsAppUrl(null)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
