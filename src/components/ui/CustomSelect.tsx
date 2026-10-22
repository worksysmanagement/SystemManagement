"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  id?: string;
  name?: string;
  required?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner une option",
  disabled = false,
  className = "",
  icon,
  id,
  name,
  required = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Handle keyboard (Escape)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Hidden input for HTML form validation & submission compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          id={id}
        />
      )}

      {/* Main Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-11 px-3.5 bg-[#F4F6F9] hover:bg-slate-50 focus:bg-white border rounded-xl text-xs font-semibold text-[#263445] transition-all flex items-center justify-between text-left select-none shadow-xs cursor-pointer ${
          open
            ? "border-[#062653] ring-2 ring-[#062653]/15 bg-white"
            : "border-[#DCE2EA] hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 mr-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className={`truncate ${selectedOption ? "text-[#263445]" : "text-slate-400 font-normal"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#062653]" : ""
          }`}
        />
      </button>

      {/* Dropdown Options Menu */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-full z-50 bg-white border border-[#DCE2EA] rounded-xl shadow-xl py-1.5 max-h-60 overflow-y-auto animate-fadeIn"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
              Aucune option disponible
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#062653] text-white font-bold"
                      : "text-[#263445] hover:bg-[#062653] hover:text-white font-semibold"
                  } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex flex-col truncate mr-2">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-slate-300" : "text-[#64748B]"
                        }`}
                      >
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
