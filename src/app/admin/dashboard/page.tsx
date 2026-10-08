"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, Search, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface DashboardMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface RequestItem {
  id: string;
  requestNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: string;
  submittedAt: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, requestsRes] = await Promise.all([
          fetch("/api/admin/requests?mode=metrics"),
          fetch("/api/admin/requests?limit=5"),
        ]);

        const metricsData = await metricsRes.json();
        const requestsData = await requestsRes.json();

        if (metricsData.metrics) setMetrics(metricsData.metrics);
        if (requestsData.items) setRecentRequests(requestsData.items);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-1">
          Aperçu global et gestion des demandes de congé de votre entreprise.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Demandes
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : metrics.total}
          </div>
        </div>

        {/* EN ATTENTE */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              En attente
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-800">
            {loading ? "..." : metrics.pending}
          </div>
        </div>

        {/* APPROUVÉES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Approuvées
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-800">
            {loading ? "..." : metrics.approved}
          </div>
        </div>

        {/* REFUSÉES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Refusées
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-800">
            {loading ? "..." : metrics.rejected}
          </div>
        </div>
      </div>

      {/* RECENT REQUESTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Demandes récentes</h2>
            <p className="text-xs text-slate-500">Les 5 dernières demandes soumises</p>
          </div>
          <Link
            href="/admin/requests"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Voir toutes les demandes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
        ) : recentRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande de congé enregistrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">N° Demande</th>
                  <th className="px-5 py-3">Employé</th>
                  <th className="px-5 py-3">Département</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Période</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {req.requestNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {req.firstName} {req.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.department}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {req.leaveType === "ANNUAL"
                        ? "Annuel"
                        : req.leaveType === "SICK"
                        ? "Maladie"
                        : req.leaveType === "UNPAID"
                        ? "Sans solde"
                        : req.leaveType === "MATERNITY_PATERNITY"
                        ? "Maternité/Paternité"
                        : "Autre"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {req.startDate} → {req.endDate} ({req.requestedDays} j)
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Consulter
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
