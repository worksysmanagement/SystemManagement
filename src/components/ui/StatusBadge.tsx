import React from "react";
import { Clock, CheckCircle2, XCircle, Ban } from "lucide-react";

export type StatusType = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ACTIVE" | "DISABLED" | "INACTIVE";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "plain";
}

export function StatusBadge({ status, size = "md", variant = "plain" }: StatusBadgeProps) {
  if (variant === "plain") {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7900]">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="8" fill="#F59E0B" />
              <path d="M8 4V8.2L10.8 9.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>En attente</span>
          </span>
        );
      case "APPROVED":
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="8" fill="#10B981" />
              <path d="M4.5 8.2L6.8 10.5L11.5 5.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{status === "APPROVED" ? "Approuvée" : "Actif"}</span>
          </span>
        );
      case "REJECTED":
      case "DISABLED":
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="8" fill="#EF4444" />
              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{status === "REJECTED" ? "Refusée" : "Désactivé"}</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Ban className="w-3.5 h-3.5 shrink-0" />
            <span>Annulée</span>
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-700">{status}</span>;
    }
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm font-medium",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  switch (status) {
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium ${sizeClasses[size]}`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#F59E0B" />
            <path d="M8 4V8.2L10.8 9.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          En attente
        </span>
      );
    case "APPROVED":
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium ${sizeClasses[size]}`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#10B981" />
            <path d="M4.5 8.2L6.8 10.5L11.5 5.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {status === "APPROVED" ? "Approuvée" : "Actif"}
        </span>
      );
    case "REJECTED":
    case "DISABLED":
    case "INACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium ${sizeClasses[size]}`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#EF4444" />
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {status === "REJECTED" ? "Refusée" : "Désactivé"}
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}
        >
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          Annulée
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
}
