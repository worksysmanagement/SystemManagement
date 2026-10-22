"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  FolderOpen,
} from "lucide-react";

export default function FinancialOperationsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "deposits";

  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals" | "expenses">(
    initialTab === "withdrawals" ? "withdrawals" : initialTab === "expenses" ? "expenses" : "deposits"
  );

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
            Opérations Financières
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Dépôts bancaires, retraits et dépenses d'exploitation de l'entreprise.
          </p>
        </div>
      </div>

      {/* 2. SUB-TABS */}
      <div className="bg-white p-2.5 rounded-xl border border-[#DCE2EA] shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "deposits", label: "Dépôts bancaires" },
          { id: "withdrawals", label: "Retraits bancaires" },
          { id: "expenses", label: "Dépenses d'exploitation" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "bg-[#062653] text-white shadow-xs"
                : "bg-[#F4F6F9] text-[#64748B] hover:bg-slate-200/80 hover:text-[#263445]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. CONTENEUR ÉPURÉ : RIEN POUR LE MOMENT */}
      <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xs p-16 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-[#F4F6F9] border border-[#DCE2EA] flex items-center justify-center mx-auto mb-4 text-[#062653]">
          <Receipt className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-[#062653] mb-1">
          Aucune opération pour le moment
        </h3>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
          Ce module financier est initialisé. Aucune transaction n'est enregistrée pour l'instant.
        </p>
      </div>
    </div>
  );
}
