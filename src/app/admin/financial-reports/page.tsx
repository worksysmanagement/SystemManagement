"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";

export default function FinancialReportsPage() {
  const searchParams = useSearchParams();
  const initialPeriod = searchParams.get("period") || "monthly";

  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    (initialPeriod as any) || "monthly"
  );

  const periodLabels: Record<string, string> = {
    daily: "Rapport journalier",
    weekly: "Rapport hebdomadaire",
    monthly: "Rapport mensuel",
    yearly: "Rapport annuel",
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
              Module Comptable
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
            Rapports Financiers
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Consolidation multi-comptes, flux bancaires et bilans périodiques.
          </p>
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS */}
      <div className="bg-white p-2.5 rounded-xl border border-[#DCE2EA] shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "daily", label: "Rapport journalier" },
          { id: "weekly", label: "Rapport hebdomadaire" },
          { id: "monthly", label: "Rapport mensuel" },
          { id: "yearly", label: "Rapport annuel" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPeriod(t.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              period === t.id
                ? "bg-[#062653] text-white shadow-xs"
                : "bg-[#F4F6F9] text-[#64748B] hover:bg-slate-200/80 hover:text-[#263445]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3. CONTENEUR ÉPURÉ : RIEN POUR LE MOMENT */}
      <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xs p-16 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-[#F4F6F9] border border-[#DCE2EA] flex items-center justify-center mx-auto mb-4 text-[#062653]">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-[#062653] mb-1">
          {periodLabels[period] || "Rapports Financiers"}
        </h3>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
          Aucune donnée financière pour le moment. Les bilans et ventilations se calculeront automatiquement dès que des opérations réelles auront été saisies.
        </p>
      </div>
    </div>
  );
}
