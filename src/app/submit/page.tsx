import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeaveRequestForm } from "@/components/forms/LeaveRequestForm";

export default function SubmitLeavePage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#062653] hover:text-[#FF7900] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF7900]" />
          Retour à la connexion
        </Link>
        <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-[#DCE2EA] shadow-2xs">
          <img src="/logo-rkonekte.png" alt="RKonekte" className="h-6 w-auto object-contain" />
          <span className="text-xs font-bold text-[#062653] border-l border-[#DCE2EA] pl-2">
            Demande de Congé
          </span>
        </div>
      </div>

      <LeaveRequestForm />
    </div>
  );
}
