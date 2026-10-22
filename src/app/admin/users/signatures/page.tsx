"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileSignature,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Upload,
  Trash2,
  Sparkles,
  Eye,
  Info,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { processTransparentImage } from "@/lib/utils/signature";

export interface SignerItem {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  canSignLeaves: boolean;
  canSignSalaryRaises: boolean;
  canSignAuthorizations: boolean;
  spendingLimitHTG: number;
  status: "ACTIVE" | "SUSPENDED";
  signatureUrl?: string | null;
}

const SAMPLE_TRANSPARENT_SIG_1 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 90' fill='none'><path d='M20,65 C45,15 75,80 110,35 C135,5 155,75 190,40 C210,20 230,70 245,30' stroke='%23062653' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/><path d='M70,55 C120,50 170,52 230,50' stroke='%23062653' stroke-width='2.5' stroke-linecap='round'/></svg>";

const SAMPLE_TRANSPARENT_SIG_2 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 90' fill='none'><path d='M25,50 C55,10 85,85 115,25 C145,85 170,15 205,60 C225,30 240,75 250,45' stroke='%230369a1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>";

const INITIAL_SIGNERS: SignerItem[] = [
  {
    id: "sig-1",
    userName: "Directeur Général (PDG)",
    userEmail: "dg@entreprise.com",
    role: "ORGANIZATION_ADMIN",
    canSignLeaves: true,
    canSignSalaryRaises: true,
    canSignAuthorizations: true,
    spendingLimitHTG: 500000,
    status: "ACTIVE",
    signatureUrl: SAMPLE_TRANSPARENT_SIG_1,
  },
  {
    id: "sig-2",
    userName: "Responsable Ressources Humaines",
    userEmail: "rh@entreprise.com",
    role: "SECRETARY",
    canSignLeaves: true,
    canSignSalaryRaises: false,
    canSignAuthorizations: false,
    spendingLimitHTG: 0,
    status: "ACTIVE",
    signatureUrl: SAMPLE_TRANSPARENT_SIG_2,
  },
  {
    id: "sig-3",
    userName: "Directeur Financier",
    userEmail: "finance@entreprise.com",
    role: "FINANCIAL_MANAGER",
    canSignLeaves: false,
    canSignSalaryRaises: true,
    canSignAuthorizations: true,
    spendingLimitHTG: 250000,
    status: "ACTIVE",
    signatureUrl: null,
  },
];

export default function SignaturesPage() {
  const [signers, setSigners] = useState<SignerItem[]>(INITIAL_SIGNERS);
  const [signerModalOpen, setSignerModalOpen] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<SignerItem | null>(null);

  // Form states for modal
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [canSignLeaves, setCanSignLeaves] = useState(true);
  const [canSignSalaryRaises, setCanSignSalaryRaises] = useState(false);
  const [canSignAuthorizations, setCanSignAuthorizations] = useState(true);
  const [spendingLimitHTG, setSpendingLimitHTG] = useState<number>(100000);
  const [formSignatureUrl, setFormSignatureUrl] = useState<string | null>(null);
  const [activeInputMode, setActiveInputMode] = useState<"upload" | "draw">("upload");
  const [toast, setToast] = useState<string | null>(null);

  // Canvas drawing ref and state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load persisted signers from Supabase API with fallback to localStorage
  useEffect(() => {
    async function loadSignatures() {
      try {
        const res = await fetch("/api/admin/signatures");
        if (res.ok) {
          const data = await res.json();
          if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
            setSigners(data.signers);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote signatures:", err);
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("rkonekte_signers_list");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSigners(parsed);
            }
          } catch (_) {}
        }
      }
    }
    loadSignatures();
  }, []);

  const saveSignersList = (newList: SignerItem[]) => {
    setSigners(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem("rkonekte_signers_list", JSON.stringify(newList));
    }
  };

  const openConfigure = (s: SignerItem) => {
    setSelectedSigner(s);
    setFormName(s.userName);
    setFormEmail(s.userEmail);
    setCanSignLeaves(s.canSignLeaves);
    setCanSignSalaryRaises(s.canSignSalaryRaises);
    setCanSignAuthorizations(s.canSignAuthorizations);
    setSpendingLimitHTG(s.spendingLimitHTG);
    setFormSignatureUrl(s.signatureUrl || null);
    setActiveInputMode("upload");
    setSignerModalOpen(true);
  };

  const openCreate = () => {
    setSelectedSigner(null);
    setFormName("");
    setFormEmail("");
    setCanSignLeaves(true);
    setCanSignSalaryRaises(false);
    setCanSignAuthorizations(false);
    setSpendingLimitHTG(100000);
    setFormSignatureUrl(null);
    setActiveInputMode("upload");
    setSignerModalOpen(true);
  };

  // Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#062653";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFormSignatureUrl(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormSignatureUrl(null);
  };

  // File Upload Handler (PNG with automatic transparent background check)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawData = event.target.result as string;
          setFormSignatureUrl(rawData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMakeTransparent = async () => {
    if (!formSignatureUrl) return;
    const transparent = await processTransparentImage(formSignatureUrl);
    setFormSignatureUrl(transparent);
    setToast("Fond blanc supprimé avec succès ! Arrière-plan transparent activé.");
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSigner) {
      const updated = signers.map((item) =>
        item.id === selectedSigner.id
          ? {
              ...item,
              canSignLeaves,
              canSignSalaryRaises,
              canSignAuthorizations,
              spendingLimitHTG,
              signatureUrl: formSignatureUrl,
            }
          : item
      );
      saveSignersList(updated);

      try {
        await fetch("/api/admin/signatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: (selectedSigner as any).userId || selectedSigner.id,
            userEmail: selectedSigner.userEmail,
            canSignLeaves,
            canSignSalaryRaises,
            canSignAuthorizations,
            spendingLimitHTG,
            status: selectedSigner.status,
          }),
        });
      } catch (err) {
        console.warn("Failed to persist signature delegation to Supabase:", err);
      }

      setToast(`Délégation et spécimen mis à jour pour ${selectedSigner.userName}.`);
    } else {
      if (!formName.trim() || !formEmail.trim()) {
        alert("Veuillez renseigner le nom et l'email du signataire.");
        return;
      }
      const newSigner: SignerItem = {
        id: `sig-${Date.now()}`,
        userName: formName.trim(),
        userEmail: formEmail.trim(),
        role: "COLLABORATEUR",
        canSignLeaves,
        canSignSalaryRaises,
        canSignAuthorizations,
        spendingLimitHTG,
        status: "ACTIVE",
        signatureUrl: formSignatureUrl,
      };
      saveSignersList([...signers, newSigner]);

      try {
        await fetch("/api/admin/signatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: formEmail.trim(),
            canSignLeaves,
            canSignSalaryRaises,
            canSignAuthorizations,
            spendingLimitHTG,
            status: "ACTIVE",
          }),
        });
      } catch (err) {
        console.warn("Failed to persist new signature delegation to Supabase:", err);
      }

      setToast(`Nouveau signataire « ${formName} » habilité avec succès.`);
    }
    setSignerModalOpen(false);
    setTimeout(() => setToast(null), 4000);
  };

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
            Droits de signature
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Délégations de signature électronique, plafonds financiers et spécimens transparents pour documents officiels.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#062653] hover:bg-[#031B3A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer border-b-2 border-[#FF7900]"
        >
          <Plus className="w-4 h-4 text-[#FF7900]" />
          Habiliter un signataire
        </button>
      </div>

      {/* 2. TOAST FEEDBACK */}
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

      {/* 3. EXPLANATORY BANNER */}
      <div className="bg-[#FFF4EB] border border-[#FF7900]/20 rounded-xl p-4 text-xs text-[#263445] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#FF7900] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#062653] block text-sm">
            Signatures Numériques Sans Arrière-Plan (PNG Transparent)
          </span>
          <p className="text-[#64748B] mt-0.5">
            Chaque signataire habilité peut enregistrer son spécimen de signature sans fond (PNG transparent).
            Lorsqu'une demande ou un bon lui est soumis, sa signature est automatiquement apposée de manière propre et certifiée sur le document final sans carré blanc.
          </p>
        </div>
      </div>

      {/* 4. SIGNERS TABLE */}
      <div className="bg-white rounded-xl border border-[#DCE2EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] text-[11px] uppercase font-bold text-[#64748B] border-b border-[#DCE2EA]">
              <tr>
                <th className="px-5 py-3">Signataire Habilité</th>
                <th className="px-5 py-3 text-center">Spécimen Transparent</th>
                <th className="px-5 py-3 text-center">Congés RH</th>
                <th className="px-5 py-3 text-center">Augmentations</th>
                <th className="px-5 py-3 text-center">Autorisations / Achats</th>
                <th className="px-5 py-3 text-right">Plafond Financier</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2EA]">
              {signers.map((s) => (
                <tr key={s.id} className="hover:bg-[#F4F6F9]/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#062653]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#062653] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {s.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{s.userName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono font-normal">
                          {s.userEmail}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* SPECIMEN THUMBNAIL WITH CHECKERBOARD TRANSPARENCY */}
                  <td className="px-5 py-3.5 text-center">
                    {s.signatureUrl ? (
                      <div className="inline-flex items-center gap-2">
                        <div
                          className="w-24 h-10 rounded border border-[#DCE2EA] flex items-center justify-center p-1 relative overflow-hidden"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                            backgroundSize: "8px 8px",
                            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                          }}
                          title="Spécimen transparent enregistré"
                        >
                          <img
                            src={s.signatureUrl}
                            alt="Spécimen"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Sans fond
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openConfigure(s)}
                        className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        + Ajouter PNG
                      </button>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    {s.canSignLeaves ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                        Autorisé
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                        Refusé
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {s.canSignSalaryRaises ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                        Autorisé
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                        Refusé
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {s.canSignAuthorizations ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                        Autorisé
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                        Refusé
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold font-mono text-[#062653]">
                    {s.spendingLimitHTG > 0
                      ? `${s.spendingLimitHTG.toLocaleString()} HTG`
                      : "Illimité"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openConfigure(s)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#062653] hover:text-[#FF7900] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Configurer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SIGNER CONFIGURATION MODAL */}
      <Modal
        isOpen={signerModalOpen}
        onClose={() => setSignerModalOpen(false)}
        title={
          selectedSigner
            ? `Délégation & Signature: ${selectedSigner.userName}`
            : "Habiliter un nouveau signataire"
        }
      >
        <form onSubmit={handleSaveSigner} className="space-y-4 text-xs">
          <p className="text-[#64748B]">
            Configurez les pouvoirs de signature électronique, le plafond d'autorisation financière et le spécimen transparent.
          </p>

          {!selectedSigner && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#062653] mb-1">
                  Nom du collaborateur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Patrick Raymond"
                  className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs text-[#263445] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#062653] mb-1">
                  Email professionnel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ex: patrick@entreprise.com"
                  className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs text-[#263445] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* SPÉCIMEN DE SIGNATURE SANS FOND (PNG TRANSPARENT) */}
          <div className="pt-2 border-t border-[#DCE2EA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#062653]">
                Spécimen officiel de signature (Sans fond / Transparent)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveInputMode("upload")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    activeInputMode === "upload"
                      ? "bg-[#062653] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Uploader PNG
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputMode("draw")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    activeInputMode === "draw"
                      ? "bg-[#062653] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Tracer stylet
                </button>
              </div>
            </div>

            {activeInputMode === "upload" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-3 px-4 border-2 border-dashed border-[#DCE2EA] hover:border-[#FF7900] bg-[#F4F6F9] hover:bg-[#FFF4EB]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#062653] mb-1" />
                    <span className="font-semibold text-slate-800 text-[11px]">
                      Choisir une image de signature (PNG, WebP)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Téléversez votre signature détourée sans arrière-plan
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/webp, image/jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Tracez votre signature ci-dessous (tracé transparent natif) :
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] font-semibold text-rose-600 hover:underline"
                  >
                    Effacer
                  </button>
                </div>
                <div className="border border-[#DCE2EA] rounded-lg bg-white overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[130px] cursor-crosshair touch-none"
                  />
                </div>
              </div>
            )}

            {/* PREVIEW CONTAINER WITH CHECKERBOARD BACKGROUND */}
            {formSignatureUrl && (
              <div className="p-3 bg-[#F8FAFC] border border-[#DCE2EA] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#062653]" />
                    <span className="font-semibold text-[#062653] text-[11px]">
                      Aperçu avec damier de transparence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMakeTransparent}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Supprime automatiquement le fond blanc de l'image"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Enlever le fond blanc
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSignatureUrl(null)}
                      className="text-rose-600 hover:text-rose-800 p-1"
                      title="Supprimer ce spécimen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className="w-full h-24 rounded-lg border border-[#DCE2EA] flex items-center justify-center p-2 relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                    backgroundSize: "12px 12px",
                    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                  }}
                >
                  <img
                    src={formSignatureUrl}
                    alt="Aperçu signature transparente"
                    className="max-h-full max-w-full object-contain drop-shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  ✓ Ce rendu transparent sera apposé directement sur les documents validés sans boîte blanche opaque.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <input
                type="checkbox"
                checked={canSignLeaves}
                onChange={(e) => setCanSignLeaves(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-[#062653]">
                Autorisation de signer les fiches de congé RH
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <input
                type="checkbox"
                checked={canSignSalaryRaises}
                onChange={(e) => setCanSignSalaryRaises(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-[#062653]">
                Autorisation de signer les augmentations de salaire
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DCE2EA] hover:bg-[#F4F6F9] cursor-pointer">
              <input
                type="checkbox"
                checked={canSignAuthorizations}
                onChange={(e) => setCanSignAuthorizations(e.target.checked)}
                className="accent-[#062653] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-[#062653]">
                Autorisation de signer les décaissements et achats
              </span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#062653] mb-1">
              Plafond financier autorisé (HTG)
            </label>
            <input
              type="number"
              min={0}
              value={spendingLimitHTG}
              onChange={(e) => setSpendingLimitHTG(Number(e.target.value))}
              placeholder="ex. 100000"
              className="w-full h-9 px-3 border border-[#DCE2EA] rounded-lg text-xs font-mono text-[#263445]"
            />
            <span className="text-[10px] text-[#64748B] mt-1 block">
              Indiquez 0 pour aucune limite (Direction Générale / PDG).
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DCE2EA]">
            <button
              type="button"
              onClick={() => setSignerModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F4F6F9] rounded-lg cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#062653] hover:bg-[#031B3A] rounded-lg shadow-xs cursor-pointer border-b-2 border-[#FF7900]"
            >
              Enregistrer l'habilitation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
