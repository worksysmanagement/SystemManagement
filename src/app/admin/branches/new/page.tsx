"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { setPendingToast, showSystemToast } from "@/components/ui/SystemToast";

export default function NewBranchPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    city: "Port-au-Prince",
    address: "",
    managerName: "",
    phone: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || "Erreur lors de la création de la succursale.";
        setError(errMsg);
        showSystemToast(errMsg, "error");
        return;
      }

      setSuccess(true);
      setPendingToast(`Succursale « ${formData.name} » créée avec succès.`);
      router.push("/admin/branches");
    } catch (err: any) {
      const errMsg = err?.message || "Erreur de connexion.";
      setError(errMsg);
      showSystemToast(errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/branches"
          className="p-2 bg-white border border-[#DCE2EA] rounded-xl hover:bg-slate-50 text-[#64748B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Créer une Nouvelle Succursale
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Ajouter un nouveau site d'exploitation pour votre entreprise.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DCE2EA] p-6 sm:p-8 shadow-xs">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            Succursale créée avec succès ! Redirection en cours...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#263445] mb-1">
                Code Succursale *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: SUD, NORD"
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#263445] mb-1">
                Nom de la Succursale *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Succursale Cayes"
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#263445] mb-1">
                Ville / Commune *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Les Cayes"
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#263445] mb-1">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+509 2811-0005"
                className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#263445] mb-1">
              Adresse complète *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Boulevard des 4 Chemins, Les Cayes"
              className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#263445] mb-1">
              Nom du Responsable de succursale *
            </label>
            <input
              type="text"
              required
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              placeholder="Ex: Pierre Valmy"
              className="w-full h-11 px-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-[#DCE2EA] flex items-center justify-end gap-3">
            <Link
              href="/admin/branches"
              className="px-5 py-2.5 bg-white border border-[#DCE2EA] hover:bg-slate-50 text-xs font-semibold text-[#64748B] rounded-xl transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? "Création..." : "Enregistrer la succursale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
