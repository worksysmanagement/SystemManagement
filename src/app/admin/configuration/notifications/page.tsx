"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Save,
  Mail,
  Smartphone,
} from "lucide-react";
import { showSystemToast } from "@/components/ui/SystemToast";

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [notifEmailLeaves, setNotifEmailLeaves] = useState(true);
  const [notifEmailRaises, setNotifEmailRaises] = useState(true);
  const [notifEmailAuths, setNotifEmailAuths] = useState(true);
  const [notifWhatsAppUrgent, setNotifWhatsAppUrgent] = useState(true);
  const [notifInAppSound, setNotifInAppSound] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // If user is employee, redirect to personal profile
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const role = data?.user?.role;
        const isEmp =
          role === "EMPLOYEE" ||
          role === "COLLABORATEUR" ||
          (typeof role === "string" &&
            (role.toLowerCase().includes("employ") || role.toLowerCase().includes("collab")));
        if (isEmp) {
          router.replace("/admin/configuration/profile");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSave = () => {
    setNotifSaved(true);
    showSystemToast("Vos préférences de notifications ont été enregistrées avec succès.");
    setTimeout(() => setNotifSaved(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
            Canaux de Notification
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
          Paramètres de Notification
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Définissez vos règles de réception d'alertes par courrier électronique et notifications instantanées WhatsApp.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE2EA] p-6 shadow-xs space-y-6">
        {notifSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Préférences de notification enregistrées avec succès.
          </div>
        )}

        {/* EMAIL NOTIFICATIONS */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-[#062653]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
              Alertes par Email Professionnel
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Sélectionnez les événements qui déclenchent un courriel immédiat à votre adresse.
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#062653] block">
                  Nouvelle demande de congé déposée
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Alerte envoyée lorsqu'un employé soumet un nouveau formulaire de congé.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifEmailLeaves}
                onChange={(e) => setNotifEmailLeaves(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#062653] block">
                  Demandes d'augmentation de salaire
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Avis lorsqu'un dossier de révision salariale est transmis pour arbitrage.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifEmailRaises}
                onChange={(e) => setNotifEmailRaises(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#062653] block">
                  Demandes de signature d'autorisation urgente
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Avis immédiat lorsqu'un bon de dépense ou de commande requiert votre signature.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifEmailAuths}
                onChange={(e) => setNotifEmailAuths(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* WHATSAPP NOTIFICATIONS */}
        <div className="pt-4 border-t border-[#DCE2EA]">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-[#FF7900]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
              Alertes Instantanées WhatsApp
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Réception d'un message direct sur votre numéro WhatsApp pour les dossiers critiques.
          </p>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
            <div>
              <span className="font-bold text-xs text-[#062653] block">
                Alertes WhatsApp de décision urgente
              </span>
              <span className="text-[11px] text-[#64748B]">
                Permet la transmission de liens d'action rapide vers les demandes et alertes en attente.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifWhatsAppUrgent}
              onChange={(e) => setNotifWhatsAppUrgent(e.target.checked)}
              className="accent-[#062653] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* IN-APP SOUND */}
        <div className="pt-4 border-t border-[#DCE2EA]">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-[#062653]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
              Signaux Sonores de l'Application
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Émission d'un signal discret lors de la réception d'une nouvelle notification à l'écran.
          </p>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
            <div>
              <span className="font-bold text-xs text-[#062653] block">
                Sonnerie in-app discrète
              </span>
              <span className="text-[11px] text-[#64748B]">
                Active un son subtil à l'arrivée d'une alerte en direct.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifInAppSound}
              onChange={(e) => setNotifInAppSound(e.target.checked)}
              className="accent-[#062653] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-[#DCE2EA] flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-white" />
            Enregistrer les préférences de notification
          </button>
        </div>
      </div>
    </div>
  );
}
