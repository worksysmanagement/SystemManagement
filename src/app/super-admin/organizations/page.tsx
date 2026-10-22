"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  Power,
  RotateCw,
  CreditCard,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: number;
  pendingCount: number;
  requestCount: number;
}

interface RenewalRecord {
  date: string;
  method: string;
  timestamp: number;
}

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual 3-month renewal state (pending MonCash API integration)
  const [selectedOrgForRenewal, setSelectedOrgForRenewal] = useState<OrganizationItem | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("MonCash (Transfert Manuel)");
  const [paymentReference, setPaymentReference] = useState("");
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [renewedDates, setRenewedDates] = useState<Record<string, RenewalRecord>>({});

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/organizations");
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("rk_org_renewals");
        if (stored) {
          setRenewedDates(JSON.parse(stored));
        }
      } catch (e) {
        // ignore localStorage error
      }
    }
  }, []);

  const getRenewalEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const confirmReactivation3Months = async () => {
    if (!selectedOrgForRenewal) return;
    setSubmittingRenewal(true);
    try {
      const res = await fetch(`/api/super-admin/organizations/${selectedOrgForRenewal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la réactivation de l'entreprise");
      }

      const expiryDate = getRenewalEndDate();
      const updated: Record<string, RenewalRecord> = {
        ...renewedDates,
        [selectedOrgForRenewal.id]: {
          date: expiryDate,
          method: paymentMethod,
          timestamp: Date.now() + 90 * 24 * 60 * 60 * 1000,
        },
      };

      setRenewedDates(updated);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("rk_org_renewals", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }

      setToastMessage({
        type: "success",
        text: `Entreprise « ${selectedOrgForRenewal.name} » réactivée avec succès pour 3 mois (Mode manuel en attendant l'API MonCash). Prochaine échéance le ${expiryDate}.`,
      });

      setIsRenewModalOpen(false);
      setSelectedOrgForRenewal(null);
      setPaymentReference("");
      await fetchOrganizations();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Erreur lors de la réactivation",
      });
    } finally {
      setSubmittingRenewal(false);
    }
  };

  const toggleStatus = async (org: OrganizationItem) => {
    const newStatus = org.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmMsg =
      newStatus === "DISABLED"
        ? `Êtes-vous sûr de vouloir désactiver "${org.name}" ? Ses utilisateurs ne pourront plus se connecter.`
        : `Réactiver l'entreprise "${org.name}" ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/super-admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrganizations();
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Entreprises clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des organisations inscrites ({organizations.length} au total).
          </p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Créer une entreprise
        </Link>
      </div>

      {/* RAPPEL FACTURATION MANUELLE MONCASH (CYCLE 3 MOIS) */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Abonnements & Paiements Manuels • Cycle de 3 mois
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                  En attente API MonCash
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Chaque 3 mois, l'entreprise cliente effectue son paiement. Cliquez sur le bouton{" "}
                <strong className="underline decoration-amber-500 decoration-2">
                  « Réactiver (3 mois) »
                </strong>{" "}
                pour valider son trimestre et prolonger son accès au système.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-bold text-amber-900">Méthode manuelle active</div>
              <div className="text-[10px] text-amber-700">90 jours par cycle de paiement</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST / FEEDBACK */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ORGANIZATIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chargement...</div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucune entreprise enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">En attente</th>
                  <th className="px-5 py-3">Total Demandes</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Abonnement (3 mois)</th>
                  <th className="px-5 py-3">Créée le</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => {
                  const renewal = renewedDates[org.id];

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{org.name}</div>
                        <div className="text-xs text-slate-400">{org.email || "Sans email"}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{org.slug}</td>
                      <td className="px-5 py-3.5 text-xs text-amber-700 font-medium">
                        {org.pendingCount} en attente
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                        {org.requestCount} demandes
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={org.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        {renewal ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              3 mois validés
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Échéance : {renewal.date}
                            </span>
                          </div>
                        ) : org.status === "ACTIVE" ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Cycle 3 mois
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Paiement manuel</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Paiement requis
                            </span>
                            <span className="text-[10px] text-amber-600 mt-0.5">À réactiver (3 mois)</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* BOUTON RÉACTIVER (3 MOIS) MANUEL */}
                          <button
                            onClick={() => {
                              setSelectedOrgForRenewal(org);
                              setIsRenewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
                            title="Réactiver ou prolonger l'abonnement pour 3 mois (Paiement manuel MonCash perçu)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Réactiver (3 mois)</span>
                          </button>

                          {/* TOGGLE STATUT */}
                          <button
                            onClick={() => toggleStatus(org)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              org.status === "ACTIVE"
                                ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                                : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {org.status === "ACTIVE" ? "Désactiver" : "Activer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE RÉACTIVATION TRIMESTRIELLE (3 MOIS) */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => {
          if (!submittingRenewal) {
            setIsRenewModalOpen(false);
            setSelectedOrgForRenewal(null);
          }
        }}
        title="Réactivation de l'abonnement (3 mois)"
        maxWidth="md"
      >
        {selectedOrgForRenewal && (
          <div className="space-y-4 p-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Entreprise cliente</div>
              <div className="text-base font-bold text-slate-900">{selectedOrgForRenewal.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedOrgForRenewal.slug}</div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <Clock className="w-4 h-4 text-amber-600" />
                Rappel de la méthode manuelle (En attente MonCash)
              </div>
              <p>
                En attendant l'automatisation via l'API MonCash, les entreprises doivent vous régler
                tous les 3 mois. En confirmant cette action, l'accès de l'entreprise sera validé pour les{" "}
                <strong>3 prochains mois (90 jours)</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mode de règlement perçu
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="MonCash (Transfert Manuel)">MonCash (Transfert Manuel)</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Paiement en Espèces">Paiement en Espèces</option>
                  <option value="Chèque / Autre">Chèque / Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Référence ou note de transaction (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Transfert MonCash #884920 ou Reçu #102"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Prochaine échéance :</span>
                </div>
                <span className="font-bold text-emerald-700">{getRenewalEndDate()} (+3 mois)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingRenewal}
                onClick={() => {
                  setIsRenewModalOpen(false);
                  setSelectedOrgForRenewal(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submittingRenewal}
                onClick={confirmReactivation3Months}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submittingRenewal ? (
                  <span>Validation en cours...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer et Réactiver (3 mois)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
