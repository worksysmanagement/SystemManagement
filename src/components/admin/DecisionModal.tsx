"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, XCircle, AlertTriangle, FileSignature, Upload, Sparkles } from "lucide-react";
import { processTransparentImage } from "@/lib/utils/signature";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "APPROVE" | "REJECT";
  requestNumber: string;
  employeeName: string;
  onConfirm: (data: { rejectionReason?: string; comment?: string; signatureUrl?: string }) => Promise<void>;
}

export function DecisionModal({
  isOpen,
  onClose,
  type,
  requestNumber,
  employeeName,
  onConfirm,
}: DecisionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transparent signature state
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showDrawMode, setShowDrawMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const isApprove = type === "APPROVE";

  // Load default transparent signature from localStorage on open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const userSig = localStorage.getItem("rkonekte_user_signature");
      if (userSig) {
        setSignatureUrl(userSig);
      } else {
        const signersStr = localStorage.getItem("rkonekte_signers_list");
        if (signersStr) {
          try {
            const list = JSON.parse(signersStr);
            const firstWithSig = list.find((s: any) => s.signatureUrl);
            if (firstWithSig?.signatureUrl) {
              setSignatureUrl(firstWithSig.signatureUrl);
            }
          } catch (_) {}
        }
      }
    }
  }, [isOpen]);

  // Canvas drawing handlers
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
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureUrl(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const raw = event.target.result as string;
          const transparent = await processTransparentImage(raw);
          setSignatureUrl(transparent);
          setShowDrawMode(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMakeTransparent = async () => {
    if (!signatureUrl) return;
    const transparent = await processTransparentImage(signatureUrl);
    setSignatureUrl(transparent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isApprove && (!rejectionReason || rejectionReason.trim().length < 3)) {
      setError("La raison du refus est obligatoire (minimum 3 caractères)");
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        rejectionReason: !isApprove ? rejectionReason.trim() : undefined,
        comment: comment.trim() || undefined,
        signatureUrl: isApprove ? signatureUrl || undefined : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Confirmer l'approbation & Visa officiel" : "Confirmer le refus"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            isApprove
              ? "bg-[#FFF4EB] border-[#FF7900]/20 text-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          {isApprove ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold text-slate-900">
              Demande : {requestNumber} — {employeeName}
            </p>
            <p className="text-xs mt-1 text-slate-600">
              {isApprove
                ? "Vous vous apprêtez à apposer votre signature certifiée sur ce document. L'attestation officielle sera transmise à l'employé."
                : "Le refus d'une demande de congé est définitif et nécessite une raison obligatoire qui sera transmise à l'employé."}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        {/* APPROVAL: TRANSPARENT SIGNATURE PREVIEW & ATTACHMENT */}
        {isApprove && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-[#062653]" />
                <span className="text-xs font-bold text-[#062653]">
                  Signature à apposer sur le document
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Changer PNG
                  <input
                    type="file"
                    accept="image/png, image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowDrawMode(!showDrawMode)}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {showDrawMode ? "Annuler tracé" : "Tracer"}
                </button>
              </div>
            </div>

            {showDrawMode ? (
              <div className="border border-slate-300 rounded-lg bg-white overflow-hidden p-1">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[100px] cursor-crosshair touch-none"
                />
              </div>
            ) : (
              <div
                className="w-full h-20 rounded-lg border border-slate-200 flex items-center justify-center p-2 relative overflow-hidden"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                }}
              >
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature transparente"
                    className="max-h-full max-w-full object-contain drop-shadow-xs"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Aucun spécimen sélectionné — Sceau numérique automatique
                  </span>
                )}
              </div>
            )}

            {signatureUrl && (
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  ✓ Signature transparente (sans fond) prête
                </span>
                <button
                  type="button"
                  onClick={handleMakeTransparent}
                  className="text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                  title="Supprime automatiquement le fond blanc si présent"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Enlever fond blanc
                </button>
              </div>
            )}
          </div>
        )}

        {!isApprove && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Raison du refus <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indiquez le motif précis du refus (ex. Effectif minimum insuffisant sur cette période...)"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || (isApprove ? !signatureUrl : rejectionReason.trim().length < 3)}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isApprove ? "Signer et Approuver" : "Refuser la demande"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
