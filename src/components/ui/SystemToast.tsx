"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  hideToast: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Fonction globale autonome pouvant être appelée depuis n'importe quel script ou composant client.
 * Émet l'événement "rkonekte_toast" capté par SystemToastContainer.
 */
export function showSystemToast(
  message: string,
  type: ToastType = "success",
  title?: string,
  duration = 5000
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rkonekte_toast", {
        detail: { message, type, title, duration },
      })
    );
  }
}

/**
 * Permet d'enregistrer un toast persistant pour la page suivante avant une redirection router.push()
 */
export function setPendingToast(
  message: string,
  type: ToastType = "success",
  title?: string
) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        "rkonekte_pending_toast",
        JSON.stringify({ message, type, title, timestamp: Date.now() })
      );
    } catch (_) {}
  }
}

/**
 * Composant de notification unifié reproduisant fidèlement le style validé :
 * - Positionné en haut à droite (top-6 right-6)
 * - Arrière-plan subtilement flouté sans bloquer les clics (backdrop-blur-[2px])
 * - Étiquette ("Success" / "Erreur") au-dessus
 * - Plaque d'accentuation colorée décalée en bas et à gauche
 * - Carte verre dépoli avec check vert ou croix rouge
 * - Pastille de fermeture ronde qui déborde en haut à droite
 * - Disparition automatique après 5 secondes
 */
export function SystemToastItem({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const isError = item.type === "error";
  const isInfo = item.type === "info";

  const defaultTitle = isError ? "Erreur" : isInfo ? "Information" : "Success";
  const title = item.title || defaultTitle;

  return (
    <>
      {/* Fond subtilement flouté sans bloquer les interactions */}
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[9990] pointer-events-none animate-in fade-in duration-300"
        aria-hidden="true"
      />

      <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm sm:max-w-md">
        {/* Label au-dessus */}
        <div
          className={`text-sm font-bold mb-1 pl-1 ${
            isError
              ? "text-rose-600"
              : isInfo
              ? "text-[#062653]"
              : "text-emerald-500"
          }`}
        >
          {title}
        </div>

        <div className="relative">
          {/* Plaque d'accentuation en arrière-plan décalée en bas et à gauche */}
          <div
            className={`absolute -left-1.5 -bottom-1.5 inset-0 rounded-xs ${
              isError
                ? "bg-rose-500"
                : isInfo
                ? "bg-[#062653]"
                : "bg-emerald-500"
            }`}
          />

          {/* Carte blanche principale avec verre flouté et ombre douce */}
          <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl px-5 py-3.5 flex items-center gap-3 pr-8 min-w-[320px] sm:min-w-[380px] rounded-sm">
            {/* Cercle avec check vert ou croix */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isError
                  ? "border-rose-500 text-rose-500"
                  : isInfo
                  ? "border-[#062653] text-[#062653]"
                  : "border-emerald-500 text-emerald-500"
              }`}
            >
              {isError ? (
                <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
              ) : isInfo ? (
                <Info className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </div>

            {/* Texte */}
            <span
              className={`text-xs font-semibold leading-relaxed ${
                isError
                  ? "text-rose-700"
                  : isInfo
                  ? "text-[#062653]"
                  : "text-emerald-600"
              }`}
            >
              {item.message}
            </span>

            {/* Bouton rond vert / rouge avec croix blanche en haut à droite qui déborde */}
            <button
              type="button"
              onClick={onClose}
              className={`absolute -top-3 -right-3 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                isError
                  ? "bg-rose-500 hover:bg-rose-600"
                  : isInfo
                  ? "bg-[#062653] hover:bg-[#031B3A]"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              title="Fermer"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Conteneur de notification réactif universel.
 * S'abonne aux événements globaux et aux messages en attente après redirection.
 */
export function SystemToastContainer() {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);

  // Vérification de toast différé suite à une redirection router.push
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("rkonekte_pending_toast");
      if (stored) {
        sessionStorage.removeItem("rkonekte_pending_toast");
        const parsed = JSON.parse(stored);
        if (parsed.message && Date.now() - (parsed.timestamp || 0) < 10000) {
          setActiveToast({
            id: `toast-${Date.now()}`,
            type: parsed.type || "success",
            title: parsed.title,
            message: parsed.message,
            duration: 5000,
          });
        }
      }
    } catch (_) {}
  }, []);

  // Écoute de l'événement custom rkonekte_toast
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      const duration = detail.duration || 5000;
      const newToast: ToastItem = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type: detail.type || "success",
        title: detail.title,
        message: detail.message,
        duration,
      };

      setActiveToast(newToast);
    };

    window.addEventListener("rkonekte_toast", handleToastEvent);
    return () => {
      window.removeEventListener("rkonekte_toast", handleToastEvent);
    };
  }, []);

  // Auto-dismiss après 5 secondes
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, activeToast.duration || 5000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <SystemToastItem
      item={activeToast}
      onClose={() => setActiveToast(null)}
    />
  );
}

export function SystemToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration = 5000) => {
      setActiveToast({
        id: `toast-${Date.now()}`,
        type,
        title,
        message,
        duration,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, activeToast.duration || 5000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <SystemToastContainer />
    </ToastContext.Provider>
  );
}

export function useSystemToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: showSystemToast,
      hideToast: () => {},
    };
  }
  return context;
}
