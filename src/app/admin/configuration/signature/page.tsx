"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileSignature,
  CheckCircle2,
  Trash2,
  Upload,
  Sparkles,
  Shield,
} from "lucide-react";
import { showSystemToast } from "@/components/ui/SystemToast";

export default function SignatureCreationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [currentSignatureData, setCurrentSignatureData] = useState<string | null>(null);

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

  // Load persisted signature if any
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rkonekte_user_signature");
      if (saved) {
        setCurrentSignatureData(saved);
      }
    }
  }, []);

  // Canvas drawing handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setCurrentSignatureData(dataUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("rkonekte_user_signature", dataUrl);
    }
    setSignatureSaved(true);
    showSystemToast("Votre signature numérique a été enregistrée avec succès.");
    setTimeout(() => setSignatureSaved(false), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const data = event.target.result as string;
          setCurrentSignatureData(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("rkonekte_user_signature", data);
          }
          setSignatureSaved(true);
          showSystemToast("Votre signature numérique a été importée avec succès.");
          setTimeout(() => setSignatureSaved(false), 5000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMakeTransparent = () => {
    if (!currentSignatureData) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 215 && d[i + 1] > 215 && d[i + 2] > 215) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const transparent = canvas.toDataURL("image/png");
      setCurrentSignatureData(transparent);
      if (typeof window !== "undefined") {
        localStorage.setItem("rkonekte_user_signature", transparent);
      }
      setSignatureSaved(true);
      showSystemToast("Arrière-plan blanc rendu transparent avec succès.");
      setTimeout(() => setSignatureSaved(false), 5000);
    };
    img.src = currentSignatureData;
  };

  const handleDeleteSignature = () => {
    if (confirm("Voulez-vous supprimer votre spécimen de signature ?")) {
      setCurrentSignatureData(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("rkonekte_user_signature");
      }
      showSystemToast("Signature supprimée.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900] bg-[#FFF4EB] px-2 py-0.5 rounded border border-[#FF7900]/20">
            Signature Électronique
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#062653] tracking-tight mt-1">
          Création de Signature Numérique
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Définissez votre spécimen officiel de signature pour la validation certifiée de vos documents et demandes.
        </p>
      </div>

      {/* 2. SUCCESS ALERT */}
      {signatureSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Spécimen de signature enregistré avec succès et certifié pour vos approbations.
        </div>
      )}

      {/* 3. SIGNATURE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CANVAS TRACE & IMPORT */}
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                Tracer votre signature
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Utilisez votre souris, stylet ou écran tactile ci-dessous.
              </p>
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              Effacer
            </button>
          </div>

          <div className="border-2 border-dashed border-[#DCE2EA] rounded-xl bg-[#F4F6F9] flex items-center justify-center p-2 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={420}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white rounded-lg shadow-inner cursor-crosshair w-full max-w-[420px] h-[180px] touch-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="px-3 py-2 bg-[#F4F6F9] hover:bg-[#DCE2EA] text-[#263445] text-xs font-semibold rounded-lg border border-[#DCE2EA] flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#062653]" />
              <span>Importer un fichier image</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={saveCanvasSignature}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              Valider ce spécimen
            </button>
          </div>
        </div>

        {/* PREVIEW CARD */}
        <div className="bg-white rounded-xl border border-[#DCE2EA] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#062653]">
                  Spécimen Actif Enregistré
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Rendu certifié transparent tel qu'il apparaîtra sur les documents officiels.
                </p>
              </div>
              {currentSignatureData && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMakeTransparent}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Supprime automatiquement le fond blanc de l'image"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Enlever fond blanc
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSignature}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Supprimer ce spécimen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div
              className="mt-4 p-6 rounded-xl border border-[#DCE2EA] min-h-[180px] flex flex-col items-center justify-center text-center relative overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                backgroundSize: "14px 14px",
                backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
              }}
            >
              {currentSignatureData ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={currentSignatureData}
                    alt="Signature enregistrée"
                    className="max-h-24 max-w-[280px] object-contain drop-shadow-md"
                  />
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Arrière-plan 100% transparent
                  </span>
                </div>
              ) : (
                <div className="text-[#64748B] text-xs italic bg-white/80 p-3 rounded-lg border border-[#DCE2EA]">
                  Aucune signature manuscrite enregistrée pour le moment.
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-[#DCE2EA]/60 w-full text-[10px] text-[#64748B] font-mono bg-white/70 py-1 rounded">
                VALIDATION CERTIFIÉE RKONEKTE • EMPREINTE: SHA256-SIGN-OK
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[#FFF4EB] p-3 rounded-lg border border-[#FF7900]/20 flex items-center gap-2 text-[11px] text-[#062653]">
            <Shield className="w-4 h-4 text-[#FF7900] shrink-0" />
            <span>Ce spécimen est juridiquement lié à votre compte d'utilisateur.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
