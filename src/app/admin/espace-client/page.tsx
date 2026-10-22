"use client";

import React from "react";
import { Users } from "lucide-react";

export default function CustomerSpacePage() {
  return (
    <div className="space-y-6">
      {/* En-tête du module */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#031B3A]">Espace Client</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Module
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Module de gestion des clients et de la satisfaction.
          </p>
        </div>
      </div>

      {/* Conteneur épuré / prêt pour les futures fonctionnalités */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#031B3A]">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-[#031B3A] mb-1">
          Espace Client
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Le module est créé et initialisé. Il est prêt à recevoir vos configurations ultérieures.
        </p>
      </div>
    </div>
  );
}
