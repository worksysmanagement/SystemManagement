"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, FileText, CheckCircle2, PlusCircle, ArrowRight, CreditCard, RotateCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  disabledOrganizations: number;
  approvedRequests: number;
  totalRequests: number;
  recentRequests: any[];
}

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/super-admin/stats");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Vue d'ensemble de la plateforme
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Supervision globale des entreprises clientes et des activités.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/onboarding-requests"
            className="px-3.5 py-2 bg-white border border-[#DCE2EA] hover:bg-slate-50 text-xs font-semibold text-[#263445] rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            Demandes en ligne
          </Link>
          <Link
            href="/super-admin/organizations/new"
            className="px-4 py-2 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Ajouter une entreprise
          </Link>
        </div>
      </div>

      {/* RAPPEL ABONNEMENTS MANUELS (CYCLE 3 MOIS - ATTENTE MONCASH) */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <CreditCard className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span>Gestion des abonnements (Cycle 3 mois)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                Attente API MonCash
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Méthode manuelle active : après réception du paiement trimestriel, utilisez le bouton <strong>« Réactiver (3 mois) »</strong> dans la liste des entreprises pour valider leur accès.
            </p>
          </div>
        </div>

        <Link
          href="/super-admin/organizations"
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Gérer les réactivations
        </Link>
      </div>

      {/* METRICS GRID - Strictly clean, unadorned, no colored background badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ORGS */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE2EA] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Entreprises Clientes
            </span>
            <Building2 className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="mt-3 text-3xl font-bold text-[#062653]">
            {loading ? "..." : stats?.totalOrganizations}
          </div>
          <div className="mt-2 text-xs text-[#64748B] flex items-center gap-2">
            <span className="text-emerald-700 font-semibold">
              {stats?.activeOrganizations} actives
            </span>
            <span>•</span>
            <span className="text-[#64748B]">{stats?.disabledOrganizations} en attente</span>
          </div>
        </div>

        {/* APPROVED REQUESTS */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE2EA] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Congés Approuvés
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="mt-3 text-3xl font-bold text-[#062653]">
            {loading ? "..." : stats?.approvedRequests}
          </div>
          <div className="mt-2 text-xs text-[#64748B]">Total des validations accordées</div>
        </div>

        {/* TOTAL REQUESTS */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE2EA] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Demandes traitées
            </span>
            <FileText className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="mt-3 text-3xl font-bold text-[#062653]">
            {loading ? "..." : stats?.totalRequests}
          </div>
          <div className="mt-2 text-xs text-[#64748B]">Volume global de congés</div>
        </div>

        {/* STATUS PLATFORM */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE2EA] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Statut Système
            </span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div className="mt-3 text-lg font-bold text-emerald-700">
            Opérationnel
          </div>
          <div className="mt-2 text-xs text-[#64748B]">Base de données & Services actifs</div>
        </div>
      </div>

      {/* RECENT PLATFORM ACTIVITY */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#DCE2EA] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#062653]">Dernières demandes (Plateforme)</h2>
            <p className="text-xs text-[#64748B]">Vue macroscopique sans exposition des données privées</p>
          </div>
          <Link
            href="/super-admin/organizations"
            className="text-xs font-semibold text-[#062653] hover:text-[#FF7900] flex items-center gap-1 transition-colors"
          >
            Gérer les entreprises
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#64748B] text-xs">Chargement...</div>
        ) : (stats?.recentRequests || []).length === 0 ? (
          <div className="p-8 text-center text-[#64748B] text-xs">
            Aucune demande sur la plateforme pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">N° Demande</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {stats?.recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#062653]">
                      {req.organizationName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#263445]">{req.requestNumber}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#64748B]">
                      {new Date(req.submittedAt).toLocaleString("fr-FR")}
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
