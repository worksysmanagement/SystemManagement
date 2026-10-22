"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  User,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Edit2,
  Key,
  Building2,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleModel, HIERARCHY_LABELS } from "@/lib/types/roles";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: number;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrateur",
  ORGANIZATION_ADMIN: "Président Directeur Général (PDG) / Propriétaire",
  ADMINISTRATEUR: "Administrateur",
  RH: "Ressources Humaines (RH)",
  SECRETARY: "Secrétaire",
  FINANCIAL_MANAGER: "Responsable Financier / Comptable",
  BRANCH_MANAGER: "Responsable de Succursale",
  EMPLOYEE: "Collaborateur / Employé",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
              Module Sécurité
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
            Liste des utilisateurs
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Gestion des comptes d'accès, affectation des rôles et des succursales.
          </p>
        </div>

        <Link
          href="/admin/employees"
          className="px-4 py-2 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer border-b-2 border-[#FF7900]"
        >
          <Users className="w-4 h-4 text-[#FF7900]" />
          Habiliter un employé
        </Link>
      </div>

      {/* 2. TOAST NOTIFICATION */}
      {toast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs text-[#263445] placeholder-[#64748B] focus:bg-white transition-colors"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#64748B]">Rôle :</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs font-semibold text-[#263445]"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ORGANIZATION_ADMIN">PDG / Propriétaire</option>
              <option value="ADMINISTRATEUR">Administrateur</option>
              <option value="RH">Ressources Humaines (RH)</option>
              <option value="SECRETARY">Secrétaire</option>
              <option value="BRANCH_MANAGER">Responsable Succursale</option>
              <option value="FINANCIAL_MANAGER">Responsable Financier / Comptable</option>
              <option value="EMPLOYEE">Collaborateur / Employé</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#64748B]">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[#F4F6F9] border border-[#DCE2EA] rounded-lg text-xs font-semibold text-[#263445]"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="DISABLED">Désactivé</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE OF USERS */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            Chargement des utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
                <tr>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Email professionnel</th>
                  <th className="px-5 py-3">Rôle système</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Date d'accès</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F4F6F9]/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#062653] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#062653] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block">{u.name}</span>
                        <span className="text-[10px] text-[#64748B] font-normal">
                          ID: {u.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#263445] font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-[#062653]">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-[#64748B]">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        title="Modifier"
                        className="p-1.5 text-[#64748B] hover:text-[#062653] hover:bg-[#F4F6F9] rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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
