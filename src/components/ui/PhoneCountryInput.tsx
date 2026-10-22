"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface CountryItem {
  name: string;
  iso: string;
  dial: string;
  flag: string;
  placeholder: string;
  maxDigits: number;
}

export const COUNTRIES: CountryItem[] = [
  { name: "Haïti", iso: "ht", dial: "+509", flag: "🇭🇹", placeholder: "3700 0000", maxDigits: 8 },
  { name: "Canada", iso: "ca", dial: "+1", flag: "🇨🇦", placeholder: "514 234 5678", maxDigits: 10 },
  { name: "États-Unis", iso: "us", dial: "+1", flag: "🇺🇸", placeholder: "202 555 0123", maxDigits: 10 },
  { name: "France", iso: "fr", dial: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78", maxDigits: 9 },
  { name: "Nigéria", iso: "ng", dial: "+234", flag: "🇳🇬", placeholder: "802 123 4567", maxDigits: 10 },
  { name: "République Dominicaine", iso: "do", dial: "+1809", flag: "🇩🇴", placeholder: "809 234 5678", maxDigits: 10 },
  { name: "Côte d'Ivoire", iso: "ci", dial: "+225", flag: "🇨🇮", placeholder: "07 01 23 45 67", maxDigits: 10 },
  { name: "Sénégal", iso: "sn", dial: "+221", flag: "🇸🇳", placeholder: "77 123 45 67", maxDigits: 9 },
  { name: "Cameroun", iso: "cm", dial: "+237", flag: "🇨🇲", placeholder: "6 70 00 00 00", maxDigits: 9 },
  { name: "Bénin", iso: "bj", dial: "+229", flag: "🇧🇯", placeholder: "97 00 00 00", maxDigits: 8 },
  { name: "Togo", iso: "tg", dial: "+228", flag: "🇹🇬", placeholder: "90 00 00 00", maxDigits: 8 },
  { name: "Gabon", iso: "ga", dial: "+241", flag: "🇬🇦", placeholder: "06 00 00 00", maxDigits: 8 },
  { name: "Congo", iso: "cg", dial: "+242", flag: "🇨🇬", placeholder: "06 000 0000", maxDigits: 9 },
  { name: "RD Congo", iso: "cd", dial: "+243", flag: "🇨🇩", placeholder: "81 000 0000", maxDigits: 9 },
  { name: "Mali", iso: "ml", dial: "+223", flag: "🇲🇱", placeholder: "70 00 00 00", maxDigits: 8 },
  { name: "Guinée", iso: "gn", dial: "+224", flag: "🇬🇳", placeholder: "620 00 00 00", maxDigits: 9 },
  { name: "Burkina Faso", iso: "bf", dial: "+226", flag: "🇧🇫", placeholder: "70 00 00 00", maxDigits: 8 },
  { name: "Maroc", iso: "ma", dial: "+212", flag: "🇲🇦", placeholder: "6 00 00 00 00", maxDigits: 9 },
  { name: "Algérie", iso: "dz", dial: "+213", flag: "🇩🇿", placeholder: "5 00 00 00 00", maxDigits: 9 },
  { name: "Tunisie", iso: "tn", dial: "+216", flag: "🇹🇳", placeholder: "20 000 000", maxDigits: 8 },
  { name: "Belgique", iso: "be", dial: "+32", flag: "🇧🇪", placeholder: "470 12 34 56", maxDigits: 9 },
  { name: "Suisse", iso: "ch", dial: "+41", flag: "🇨🇭", placeholder: "78 123 45 67", maxDigits: 9 },
  { name: "Royaume-Uni", iso: "gb", dial: "+44", flag: "🇬🇧", placeholder: "7911 123456", maxDigits: 10 },
  { name: "Allemagne", iso: "de", dial: "+49", flag: "🇩🇪", placeholder: "151 23456789", maxDigits: 11 },
  { name: "Espagne", iso: "es", dial: "+34", flag: "🇪🇸", placeholder: "612 34 56 78", maxDigits: 9 },
  { name: "Italie", iso: "it", dial: "+39", flag: "🇮🇹", placeholder: "312 345 6789", maxDigits: 10 },
  { name: "Brésil", iso: "br", dial: "+55", flag: "🇧🇷", placeholder: "11 91234 5678", maxDigits: 11 },
  { name: "Mexique", iso: "mx", dial: "+52", flag: "🇲🇽", placeholder: "55 1234 5678", maxDigits: 10 },
  { name: "Colombie", iso: "co", dial: "+57", flag: "🇨🇴", placeholder: "300 123 4567", maxDigits: 10 },
  { name: "Ghana", iso: "gh", dial: "+233", flag: "🇬🇭", placeholder: "20 123 4567", maxDigits: 9 },
  { name: "Afrique du Sud", iso: "za", dial: "+27", flag: "🇿🇦", placeholder: "71 123 4567", maxDigits: 9 },
  { name: "Rwanda", iso: "rw", dial: "+250", flag: "🇷🇼", placeholder: "788 123 456", maxDigits: 9 },
  { name: "Madagascar", iso: "mg", dial: "+261", flag: "🇲🇬", placeholder: "32 00 000 00", maxDigits: 9 },
  { name: "Maurice", iso: "mu", dial: "+230", flag: "🇲🇺", placeholder: "5250 1234", maxDigits: 8 },
  { name: "Chine", iso: "cn", dial: "+86", flag: "🇨🇳", placeholder: "138 0000 0000", maxDigits: 11 },
  { name: "Inde", iso: "in", dial: "+91", flag: "🇮🇳", placeholder: "98765 43210", maxDigits: 10 },
  { name: "Émirats Arabes Unis", iso: "ae", dial: "+971", flag: "🇦🇪", placeholder: "50 123 4567", maxDigits: 9 },
];

interface PhoneCountryInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  required?: boolean;
  id?: string;
  name?: string;
  defaultIso?: string;
  className?: string;
  labelPosition?: "inside" | "top";
}

// Extracts only the digits of the local number (removes dial code if included)
function extractRawDigits(raw: string, currentDial: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // If starts with current country dial, remove it
  if (clean.startsWith(currentDial)) {
    clean = clean.slice(currentDial.length).trim();
  } else {
    // If starts with another country dial, remove that dial
    for (const c of COUNTRIES) {
      if (clean.startsWith(c.dial)) {
        clean = clean.slice(c.dial.length).trim();
        break;
      }
    }
  }

  // Remove any non-digits
  return clean.replace(/\D/g, "");
}

// Formats digits according to the specific national phone pattern of the selected country
function formatLocalNumber(digits: string, country: CountryItem): string {
  if (!digits) return "";
  const d = digits.slice(0, country.maxDigits);
  const iso = country.iso;

  // Canada, USA, Dominican Republic, Nigeria, Mexico, Colombia, Italy (10 digits -> XXX XXX XXXX)
  if (["ca", "us", "do", "ng", "mx", "co", "it"].includes(iso)) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  // Haïti (8 digits -> XXXX XXXX)
  if (iso === "ht") {
    if (d.length <= 4) return d;
    return `${d.slice(0, 4)} ${d.slice(4)}`;
  }

  // France, Cameroon, Morocco, Algeria (9 digits -> X XX XX XX XX)
  if (["fr", "cm", "ma", "dz"].includes(iso)) {
    if (d.length <= 1) return d;
    if (d.length <= 3) return `${d.slice(0, 1)} ${d.slice(1)}`;
    if (d.length <= 5) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  // Côte d'Ivoire (10 digits -> XX XX XX XX XX)
  if (iso === "ci") {
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4)}`;
    if (d.length <= 8) return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }

  // Sénégal, Congo, RD Congo, Guinée, Belgique, Suisse, Ghana, Afrique du Sud (9 digits -> XX XXX XX XX)
  if (["sn", "cg", "cd", "gn", "be", "ch", "gh", "za", "rw", "mg", "ae"].includes(iso)) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  // Bénin, Togo, Gabon, Mali, Burkina Faso, Maurice, Tunisie (8 digits -> XX XX XX XX)
  if (["bj", "tg", "ga", "ml", "bf", "mu", "tn"].includes(iso)) {
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
  }

  // Allemagne, Brésil, Chine (11 digits -> XXX XXXX XXXX)
  if (["de", "br", "cn"].includes(iso)) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
  }

  // Default fallback grouping
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function PhoneCountryInput({
  value,
  onChange,
  label = "Numéro de téléphone *",
  required = false,
  id = "phone-input",
  name = "phone",
  defaultIso = "ht",
  className = "",
  labelPosition = "top",
}: PhoneCountryInputProps) {
  const isTopLabel = labelPosition === "top";
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Identify current selected country based on phone prefix or default (Haïti)
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(() => {
    if (value) {
      const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
      const match = sorted.find((c) => value.startsWith(c.dial));
      if (match) return match;
    }
    const targetIso = (defaultIso || "ht").toLowerCase();
    return COUNTRIES.find((c) => c.iso === targetIso) || COUNTRIES[0];
  });

  // Extract raw digits and formatted display value
  const rawDigits = extractRawDigits(value, selectedCountry.dial);
  const formattedLocalNumber = formatLocalNumber(rawDigits, selectedCountry);

  // Sync selected country when defaultIso changes asynchronously (e.g. from company database) and input is empty
  const lastDefaultIsoRef = useRef(defaultIso);
  useEffect(() => {
    const targetIso = (defaultIso || "ht").toLowerCase();
    if (targetIso !== lastDefaultIsoRef.current) {
      lastDefaultIsoRef.current = targetIso;
      if (!value) {
        const match = COUNTRIES.find((c) => c.iso === targetIso);
        if (match) {
          setSelectedCountry(match);
        }
      }
    }
  }, [defaultIso, value]);

  // Sync selected country if value changes from outside with a different dial code
  useEffect(() => {
    if (value) {
      // If current selected country already matches the dial code (e.g. Canada with +1), do not overwrite with USA
      if (value.startsWith(selectedCountry.dial)) {
        return;
      }
      const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
      const match = sorted.find((c) => value.startsWith(c.dial));
      if (match && match.iso !== selectedCountry.iso) {
        setSelectedCountry(match);
      }
    }
  }, [value, selectedCountry.dial, selectedCountry.iso]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Filter countries according to search term
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.iso.toLowerCase().includes(search.toLowerCase())
  );

  // Handle country selection
  const handleSelectCountry = (country: CountryItem) => {
    setSelectedCountry(country);
    setOpen(false);
    setSearch("");

    // Reformat existing digits according to new country's pattern
    const newFormatted = formatLocalNumber(rawDigits, country);
    const updated = newFormatted ? `${country.dial} ${newFormatted}` : "";
    onChange(updated);
  };

  // Handle local number typing
  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const digits = extractRawDigits(inputVal, selectedCountry.dial);
    const newFormatted = formatLocalNumber(digits, selectedCountry);
    const full = newFormatted ? `${selectedCountry.dial} ${newFormatted}` : "";
    onChange(full);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {isTopLabel && label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#263445] mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Outer Combined Container */}
      <div
        className={`flex items-stretch ${
          isTopLabel ? "h-11" : "h-[54px]"
        } w-full bg-[#F4F6F9] hover:bg-slate-50 focus-within:bg-white border border-[#DCE2EA] focus-within:border-[#FF7900] focus-within:ring-3 focus-within:ring-[#FF7900]/15 rounded-xl transition-all shadow-xs overflow-hidden`}
      >
        {/* Left: Flag & Chevron Button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="px-2.5 bg-[#EEF2F6] hover:bg-[#E2E8F0] border-r border-[#DCE2EA] rounded-l-xl flex items-center gap-1 cursor-pointer transition-colors shrink-0 select-none group"
          title={`Pays : ${selectedCountry.name} (${selectedCountry.dial}) - Cliquez pour changer`}
        >
          <img
            src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
            alt={selectedCountry.name}
            className="w-4.5 h-3.5 object-cover rounded-2xs shadow-xs"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const span = e.currentTarget.nextElementSibling;
              if (span) span.classList.remove("hidden");
            }}
          />
          <span className="hidden text-base leading-none">{selectedCountry.flag}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-500 group-hover:text-slate-800 transition-transform duration-200 ${
              open ? "rotate-180 text-[#FF7900]" : ""
            }`}
          />
        </button>

        {/* Right: Floating Label (if inside) + Dial Code Prefix + Clean Phone Input */}
        <div
          className={`flex-1 px-3 ${
            isTopLabel
              ? "flex items-center gap-2 min-w-0"
              : "py-1.5 flex flex-col justify-center min-w-0"
          }`}
        >
          {!isTopLabel && label && (
            <label
              htmlFor={id}
              className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block select-none pointer-events-none leading-none mb-1"
            >
              {label}
            </label>
          )}
          <div className="flex items-center gap-1.5 w-full">
            {/* Fixed Country Dial Code */}
            <span className="text-xs font-bold text-[#062653] select-none shrink-0 tracking-tight">
              {selectedCountry.dial}
            </span>
            {/* Editable Local Number with Country-Specific Placeholder & Limit */}
            <input
              id={id}
              name={name}
              type="tel"
              required={required}
              value={formattedLocalNumber}
              onChange={handleLocalNumberChange}
              placeholder={selectedCountry.placeholder}
              className="w-full text-xs font-medium text-[#263445] bg-transparent outline-none p-0 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 animate-fadeIn max-h-72 flex flex-col">
          {/* Search Box */}
          <div className="relative mb-2 shrink-0">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays ou indicatif..."
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF7900] transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* List of Countries */}
          <div className="overflow-y-auto space-y-0.5 flex-1 pr-1 custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.iso === selectedCountry.iso;
                return (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF4EB] text-[#FF7900] font-bold"
                        : "hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={`https://flagcdn.com/w40/${c.iso}.png`}
                        alt=""
                        className="w-4 h-3 object-cover rounded-2xs shrink-0"
                      />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold shrink-0 ${
                        isSelected ? "text-[#FF7900]" : "text-slate-600"
                      }`}
                    >
                      {c.dial}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Automatically detects the country ISO code from a phone string and/or address.
 * Falls back to "ht" (Haïti) if no other country matches.
 */
export function detectCountryFromPhone(
  phone?: string | null,
  address?: string | null
): string {
  const cleanPhone = (phone || "").trim().replace(/[\s\-\(\)\.]/g, "");
  const cleanAddress = (address || "").toLowerCase();

  if (cleanPhone) {
    // Sort COUNTRIES by dial length descending so "+1809" is evaluated before "+1"
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

    // Standard format with "+" prefix
    for (const c of sorted) {
      if (cleanPhone.startsWith(c.dial)) {
        // Special case: +1 is shared by Canada and USA
        if (c.dial === "+1") {
          if (
            cleanAddress.includes("canada") ||
            cleanAddress.includes("qc") ||
            cleanAddress.includes("québec") ||
            cleanAddress.includes("quebec") ||
            cleanAddress.includes("montreal") ||
            cleanAddress.includes("montréal") ||
            cleanAddress.includes("ontario") ||
            cleanAddress.includes("toronto") ||
            cleanAddress.includes("ottawa")
          ) {
            return "ca";
          }
          if (
            cleanAddress.includes("usa") ||
            cleanAddress.includes("états-unis") ||
            cleanAddress.includes("etats-unis") ||
            cleanAddress.includes("miami") ||
            cleanAddress.includes("florida") ||
            cleanAddress.includes("ny")
          ) {
            return "us";
          }
          return "ca";
        }
        return c.iso;
      }
    }

    // Numbers written as 00XXX instead of +XXX
    if (cleanPhone.startsWith("00")) {
      const withPlus = "+" + cleanPhone.slice(2);
      for (const c of sorted) {
        if (withPlus.startsWith(c.dial)) {
          return c.iso;
        }
      }
    }

    // Standard 8-digit mobile without country code in Haïti (e.g. 37000000, 48000000)
    if (/^\d{8}$/.test(cleanPhone)) {
      return "ht";
    }
  }

  // Address-based detection fallback
  if (cleanAddress) {
    if (
      cleanAddress.includes("haïti") ||
      cleanAddress.includes("haiti") ||
      cleanAddress.includes("port-au-prince") ||
      cleanAddress.includes("pétion-ville") ||
      cleanAddress.includes("petion-ville") ||
      cleanAddress.includes("delmas") ||
      cleanAddress.includes("cap-haïtien") ||
      cleanAddress.includes("gonaïves")
    ) {
      return "ht";
    }
    if (
      cleanAddress.includes("canada") ||
      cleanAddress.includes("montréal") ||
      cleanAddress.includes("montreal") ||
      cleanAddress.includes("quebec") ||
      cleanAddress.includes("québec")
    ) {
      return "ca";
    }
    if (cleanAddress.includes("france") || cleanAddress.includes("paris")) {
      return "fr";
    }
    if (
      cleanAddress.includes("états-unis") ||
      cleanAddress.includes("etats-unis") ||
      cleanAddress.includes("usa")
    ) {
      return "us";
    }
    if (
      cleanAddress.includes("dominicaine") ||
      cleanAddress.includes("domingo") ||
      cleanAddress.includes("santo domingo")
    ) {
      return "do";
    }
  }

  return "ht";
}
