"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Users, MapPin, Phone, Edit2, X, Check, Eye, Trash2 } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { showSystemToast } from "@/components/ui/SystemToast";

interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  managerName: string;
  phone: string;
  employeeCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const [resBranches, resEmps] = await Promise.all([
        fetch("/api/admin/branches"),
        fetch("/api/admin/employees"),
      ]);
      const data = await resBranches.json();
      const empData = await resEmps.json();
      const emps = Array.isArray(empData?.employees) ? empData.employees : [];

      if (data.branches && Array.isArray(data.branches)) {
        setBranches(
          data.branches.map((b: any) => {
            const count = emps.filter(
              (e: any) => e.branchId === b.id || e.branch === b.name
            ).length;
            return {
              id: b.id,
              code: b.code,
              name: b.name,
              city: b.city,
              address: b.address || "",
              managerName: b.managerName || "Responsable d'agence",
              phone: b.phone || "",
              employeeCount: count,
              status: b.status || "ACTIVE",
            };
          })
        );
      } else {
        setBranches([]);
      }
    } catch (e) {
      console.error("Failed to load branches:", e);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    city: "",
    address: "",
    managerName: "",
    phone: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const openEdit = (b: Branch) => {
    setEditingBranch(b);
    setFormData({
      code: b.code,
      name: b.name,
      city: b.city,
      address: b.address,
      managerName: b.managerName,
      phone: b.phone,
      status: b.status,
    });
    setIsEditModalOpen(true);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    try {
      const res = await fetch(`/api/admin/branches/${editingBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de la modification de la succursale.");
        return;
      }

      setBranches((prev) =>
        prev.map((b) => (b.id === editingBranch.id ? { ...b, ...formData } : b))
      );
      setIsEditModalOpen(false);
      if (selectedBranch && selectedBranch.id === editingBranch.id) {
        setSelectedBranch({ ...selectedBranch, ...formData });
      }
      setToastMessage(`La succursale « ${formData.name} » a été modifiée avec succès.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Erreur réseau.");
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement la succursale « ${name} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/branches/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Impossible de supprimer la succursale.");
        return;
      }

      setBranches((prev) => prev.filter((b) => b.id !== id));
      if (selectedBranch && selectedBranch.id === id) {
        setSelectedBranch(null);
      }
      setToastMessage(`La succursale « ${name} » a été supprimée avec succès.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Erreur de connexion.");
    }
  };

  const filtered = branches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.managerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
            Succursales de l'Entreprise
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {loading
              ? "Chargement des succursales de l'entreprise..."
              : `Gestion des sites d'exploitation, adresses et effectifs associés (${branches.length} ${
                  branches.length > 1 ? "succursales" : "succursale"
                }).`}
          </p>
        </div>

        <Link
          href="/admin/branches/new"
          className="px-4 py-2 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Ajouter une succursale
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE2EA] shadow-xs flex items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, ville, responsable..."
            className="w-full h-10 pl-9 pr-3.5 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder:text-[#64748B] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Chargement des succursales en cours...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            {searchTerm
              ? "Aucune succursale ne correspond à votre recherche."
              : "Aucune succursale enregistrée pour le moment."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Nom de la succursale</th>
                  <th className="px-5 py-3.5">Ville & Adresse</th>
                  <th className="px-5 py-3.5">Responsable</th>
                  <th className="px-5 py-3.5">Téléphone</th>
                  <th className="px-5 py-3.5">Effectif</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#062653]">{b.code}</td>
                    <td className="px-5 py-4 font-bold text-[#263445]">{b.name}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#263445]">{b.city}</div>
                      <div className="text-[11px] text-[#64748B]">{b.address}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#263445]">{b.managerName}</td>
                    <td className="px-5 py-4 text-[#263445] font-medium">{b.phone}</td>
                    <td className="px-5 py-4 font-bold text-[#062653]">
                      {b.employeeCount} employés
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status || "ACTIVE"} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBranch(b)}
                          className="w-8 h-8 rounded-lg bg-[#FF7900] hover:bg-[#E66D00] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4 text-white shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-white shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-white shrink-0" />
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

      {/* DETAIL DRAWER / MODAL */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xl max-w-lg w-full p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <div>
                <span className="text-[11px] font-bold text-[#FF7900]">
                  {selectedBranch.code}
                </span>
                <h2 className="text-base font-bold text-[#062653]">{selectedBranch.name}</h2>
              </div>
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-[#64748B] hover:text-[#263445]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F4F6F9] rounded-xl">
                <span className="text-[#64748B] font-semibold">Ville & Emplacement</span>
                <div className="font-bold text-[#263445] mt-1">{selectedBranch.city}</div>
                <div className="text-[#64748B] mt-0.5">{selectedBranch.address}</div>
              </div>

              <div className="p-3 bg-[#F4F6F9] rounded-xl">
                <span className="text-[#64748B] font-semibold">Responsable de site</span>
                <div className="font-bold text-[#263445] mt-1">{selectedBranch.managerName}</div>
                <div className="text-[#64748B] font-mono mt-0.5">{selectedBranch.phone}</div>
              </div>

              <div className="col-span-2 p-3 bg-[#FFF4EB] rounded-xl border border-[#FF7900]/20 flex items-center justify-between">
                <div>
                  <span className="text-[#FF7900] font-semibold">Effectif rattaché</span>
                  <div className="font-bold text-[#062653] text-sm mt-0.5">
                    {selectedBranch.employeeCount} employés en service
                  </div>
                </div>
                <Link
                  href={`/admin/employees`}
                  className="px-3 py-1.5 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Voir les employés
                </Link>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBranch(null)}
                className="px-4 py-2 bg-white border border-[#DCE2EA] text-[#64748B] hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DCE2EA] shadow-xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA]">
              <h2 className="text-base font-bold text-[#062653]">Modifier la succursale</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#64748B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#263445] mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#263445] mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#263445] mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#263445] mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#263445] mb-1">Adresse complète *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#263445] mb-1">Nom du responsable *</label>
                <input
                  type="text"
                  required
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full h-10 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-xl text-xs text-[#263445] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE2EA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#DCE2EA] text-[#64748B] hover:bg-slate-50 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-bold rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
