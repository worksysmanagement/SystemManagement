"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Bell,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Building,
  UserCheck,
  Briefcase,
  Layers,
  Trash2,
} from "lucide-react";
import { showSystemToast } from "@/components/ui/SystemToast";

export interface EmployeeProfile {
  id?: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  position: string;
  branch: string;
  email?: string;
}

export type EventType =
  | "MEETING"
  | "TRAINING"
  | "HOLIDAY"
  | "ANNOUNCEMENT"
  | "WORKSHOP"
  | "PERSONAL";

export type PersonalCategory =
  | "RDV"
  | "REMINDER"
  | "TASK"
  | "ADMIN_STEP"
  | "PERSONAL_LEAVE"
  | "OTHER";

export const PERSONAL_CATEGORY_LABELS: Record<PersonalCategory, string> = {
  RDV: "Rendez-vous personnel",
  REMINDER: "Rappel / Mémo",
  TASK: "Tâche personnelle",
  ADMIN_STEP: "Démarche administrative",
  PERSONAL_LEAVE: "Congé / Absence personnelle",
  OTHER: "Autre événement personnel",
};

export type AudienceType =
  | "ALL_EMPLOYEES"
  | "DEPARTMENT"
  | "BRANCH"
  | "CUSTOM";

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  audienceType?: AudienceType;
  audienceTargetName?: string;
  notifyImmediate?: boolean;
  reminder24h?: boolean;
  isPersonal?: boolean;
  personalCategory?: PersonalCategory;
  creatorEmployeeNumber?: string;
  creatorName?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  EventType,
  { label: string; bg: string; text: string; dot: string }
> = {
  MEETING: {
    label: "Réunion",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-600",
  },
  TRAINING: {
    label: "Formation",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-600",
  },
  HOLIDAY: {
    label: "Férié / Congé",
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  ANNOUNCEMENT: {
    label: "Annonce générale",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-600",
  },
  WORKSHOP: {
    label: "Atelier de travail",
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    text: "text-cyan-700",
    dot: "bg-cyan-600",
  },
  PERSONAL: {
    label: "Personnel",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    text: "text-indigo-700",
    dot: "bg-indigo-600",
  },
};

const AUDIENCE_LABELS: Record<AudienceType, string> = {
  ALL_EMPLOYEES: "Tous les employés",
  DEPARTMENT: "Par département",
  BRANCH: "Par succursale",
  CUSTOM: "Employés ciblés",
};

const STORAGE_KEY = "rkonekte_scheduled_events";

const PROFILE_STORAGE_KEY = "rkonekte_cached_employee_profile";

function getCachedProfile(): EmployeeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export default function EventsCalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split("T")[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User role & profile
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(() => getCachedProfile());
  const [loadingUser, setLoadingUser] = useState(true);

  // Events list: Default to empty [] as requested by user ("mets y aucun evenement pour le moment parce que l'administration n'a rien de prévu")
  const [events, setEvents] = useState<ScheduledEvent[]>([]);

  useEffect(() => {
    // 1. Get user role
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setCurrentUserRole(data.user.role);
        } else {
          setCurrentUserRole("EMPLOYEE");
        }
      })
      .catch(() => setCurrentUserRole("EMPLOYEE"))
      .finally(() => setLoadingUser(false));

    // 2. Get employee profile for the institutional collaborator header
    fetch("/api/admin/my-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data.profile));
          } catch (_) {}
        }
      })
      .catch(() => {});

    // 3. Load events from localStorage (default: empty array [])
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      } else {
        setEvents([]);
      }
    } catch (_) {
      setEvents([]);
    }
  }, []);

  const isEmployee =
    currentUserRole === "EMPLOYEE" ||
    currentUserRole?.toLowerCase().includes("employ") ||
    currentUserRole?.toLowerCase().includes("collab") ||
    currentUserRole?.toLowerCase().includes("operat");

  const isAdmin = !isEmployee && currentUserRole !== null;

  // Filter events:
  // 1. Personal events are strictly private to the user who created them
  // 2. Enterprise events: Admin sees all; Collaborators see events for ALL_EMPLOYEES or targeted to their dept/branch
  const visibleEvents = useMemo(() => {
    return events.filter((ev) => {
      // Personal event check
      if (ev.isPersonal || ev.type === "PERSONAL") {
        if (!profile?.employeeNumber && !ev.creatorEmployeeNumber) return true;
        return ev.creatorEmployeeNumber === profile?.employeeNumber;
      }

      // Enterprise / Administration event check
      if (isAdmin) {
        return true;
      }
      if (ev.audienceType === "ALL_EMPLOYEES") return true;
      if (ev.audienceType === "DEPARTMENT") {
        if (!profile?.department) return true;
        return ev.audienceTargetName
          ?.toLowerCase()
          .includes(profile.department.toLowerCase());
      }
      if (ev.audienceType === "BRANCH") {
        if (!profile?.branch) return true;
        return ev.audienceTargetName
          ?.toLowerCase()
          .includes(profile.branch.toLowerCase());
      }
      return true;
    });
  }, [events, isAdmin, profile]);

  // Modal form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [type, setType] = useState<EventType>("MEETING");
  const [personalCategory, setPersonalCategory] =
    useState<PersonalCategory>("RDV");
  const [location, setLocation] = useState("");
  const [audienceType, setAudienceType] =
    useState<AudienceType>("ALL_EMPLOYEES");
  const [audienceTargetName, setAudienceTargetName] = useState("");
  const [notifyImmediate, setNotifyImmediate] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const currentMonthStr = String(currentMonth + 1).padStart(2, "0");

  // Calendar cells
  const calendarCells = useMemo(() => {
    const cells: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: ScheduledEvent[];
    }[] = [];

    // Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        events: visibleEvents.filter((e) => e.date === dateStr),
      });
    }

    // Current month days
    const todayStr = today.toISOString().split("T")[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: visibleEvents.filter((e) => e.date === dateStr),
      });
    }

    // Next month leading days to complete grid (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        events: visibleEvents.filter((e) => e.date === dateStr),
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, daysInPrevMonth, visibleEvents]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return visibleEvents.filter((e) => e.date === selectedDate);
  }, [visibleEvents, selectedDate]);


  // Submit handler: Supports both Administrative Events (for Admin) and Personal Events (for Collaborator)
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    if (isAdmin) {
      // 1. Administration Event (Official Enterprise Planning)
      const newEvent: ScheduledEvent = {
        id: `ev-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        date: eventDate,
        startTime: startTime || "09:00",
        endTime: endTime || "10:00",
        type,
        location: location.trim() || "Bureaux de l'entreprise",
        audienceType,
        audienceTargetName:
          audienceType !== "ALL_EMPLOYEES"
            ? audienceTargetName.trim() || "Cible sélectionnée"
            : undefined,
        notifyImmediate,
        reminder24h,
        isPersonal: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [...events, newEvent];
      setEvents(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}

      setSelectedDate(eventDate);
      setIsModalOpen(false);

      // Reset fields
      setTitle("");
      setDescription("");
      setLocation("");
      setAudienceTargetName("");

      const targetDesc =
        audienceType === "ALL_EMPLOYEES"
          ? "tous les employés de l'entreprise"
          : `${audienceTargetName || "le groupe sélectionné"}`;
      showSystemToast(
        `Événement d'administration « ${newEvent.title} » programmé ! Alertes activées pour ${targetDesc}.`
      );
    } else {
      // 2. Personal Event (Collaborator Private Planning)
      const newEvent: ScheduledEvent = {
        id: `ev-perso-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        date: eventDate,
        startTime: startTime || "09:00",
        endTime: endTime || "10:00",
        type: "PERSONAL",
        personalCategory,
        location: location.trim() || "Personnel",
        isPersonal: true,
        creatorEmployeeNumber: profile?.employeeNumber || "current-user",
        creatorName: profile
          ? `${profile.firstName} ${profile.lastName}`
          : "Collaborateur",
        notifyImmediate: false,
        reminder24h,
        createdAt: new Date().toISOString(),
      };

      const updated = [...events, newEvent];
      setEvents(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}

      setSelectedDate(eventDate);
      setIsModalOpen(false);

      // Reset fields
      setTitle("");
      setDescription("");
      setLocation("");
      setPersonalCategory("RDV");

      showSystemToast(
        `Événement personnel « ${newEvent.title} » enregistré dans votre calendrier privé !`
      );
    }
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const evToDelete = events.find((ev) => ev.id === id);
    if (!evToDelete) return;

    const isOwner =
      evToDelete.isPersonal &&
      evToDelete.creatorEmployeeNumber === profile?.employeeNumber;
    if (!isAdmin && !isOwner) {
      alert("Vous n'êtes pas autorisé à supprimer cet événement.");
      return;
    }

    if (
      !confirm(
        evToDelete.isPersonal
          ? "Supprimer cet événement personnel ?"
          : "Voulez-vous supprimer cet événement officiel ?"
      )
    )
      return;

    const updated = events.filter((ev) => ev.id !== id);
    setEvents(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    showSystemToast("Événement supprimé avec succès.");
  };

  const openModalForDate = (dateStr: string) => {
    setEventDate(dateStr);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl shadow-md transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-medium flex-1">{successToast}</div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar: Distinct for Non-Administrative vs Administrative Accounts */}
      {loadingUser ? (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-6 bg-slate-200 rounded w-1/4" />
        </div>
      ) : isEmployee ? (
        /* Profil Header Collaborateur (Harmonisé avec Congés / Salaires / Signatures) */
        <div className="bg-white rounded-2xl p-5 border border-[#DCE2EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#062653] tracking-tight">
              Mon Espace Événements
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Consultez les réunions d'équipe, formations et événements officiels de l'entreprise.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Informations fixes pré-remplies (sans background, texte en gras) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#062653]">
              <div className="flex items-center gap-1.5">
                <span>Matricule :</span>
                {profile?.employeeNumber ? (
                  <strong className="text-[#FF7900] font-mono font-bold">
                    {profile.employeeNumber}
                  </strong>
                ) : (
                  <span className="inline-block w-24 h-3.5 bg-slate-200 animate-pulse rounded-sm" />
                )}
              </div>
              <span className="text-slate-300 font-normal">|</span>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                {profile?.branch ? (
                  <span>{profile.branch}</span>
                ) : (
                  <span className="inline-block w-20 h-3.5 bg-slate-200 animate-pulse rounded-sm" />
                )}
              </div>
              <span className="text-slate-300 font-normal">|</span>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                {profile?.position ? (
                  <span>{profile.position}</span>
                ) : (
                  <span>Employé</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Header Bar Administration */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#031B3A]">
                Événements & Calendrier d'Entreprise
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#031B3A]/10 text-[#031B3A]">
                Planification de l'administration
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Programmez des réunions, formations ou annonces officielles et diffusez les notifications aux employés ciblés.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEventDate(selectedDate);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#031B3A] hover:bg-[#042854] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
            title="Planification de l'administration"
          >
            <Plus className="w-4 h-4" />
            Planification de l'administration
          </button>
        </div>
      )}

      {/* Main Grid: Calendar on Left, Upcoming / Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Calendar (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#031B3A] text-white flex items-center justify-center shadow-xs">
                <img
                  src="/icons/sidebar/calendar-white.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#031B3A]">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <p className="text-xs text-slate-500">
                  {events.filter((e) => e.date.startsWith(`${currentYear}-${currentMonthStr}`)).length} événement(s) ce mois-ci
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors"
              >
                Aujourd'hui
              </button>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200" />
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-bold text-slate-600 py-2.5">
            {daysOfWeek.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-slate-200 gap-px">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDate;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[92px] p-1.5 sm:p-2 bg-white flex flex-col justify-between transition-colors cursor-pointer group relative ${
                    !cell.isCurrentMonth ? "bg-slate-50/70 text-slate-400" : "text-slate-800"
                  } ${isSelected ? "ring-2 ring-inset ring-[#031B3A] bg-blue-50/30" : "hover:bg-slate-50"}`}
                >
                    {/* Day number & Quick add (Admin only) */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          cell.isToday
                            ? "bg-[#031B3A] text-white font-bold"
                            : isSelected
                            ? "bg-slate-200 text-[#031B3A] font-bold"
                            : ""
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModalForDate(cell.dateStr);
                          }}
                          title="Planification de l'administration"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#031B3A] p-0.5 rounded hover:bg-slate-200/60 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModalForDate(cell.dateStr);
                          }}
                          title="Planifier un événement perso"
                          className="opacity-0 group-hover:opacity-100 text-[#FF7900] hover:text-[#062653] p-0.5 rounded hover:bg-orange-50 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  {/* Event pills in day cell */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {cell.events.slice(0, 2).map((ev) => {
                      const cfg = TYPE_CONFIG[ev.type];
                      return (
                        <div
                          key={ev.id}
                          title={`${ev.startTime} - ${ev.title} (${
                            ev.isPersonal
                              ? "Personnel"
                              : ev.audienceType
                              ? AUDIENCE_LABELS[ev.audienceType]
                              : "Général"
                          })`}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border ${cfg.bg}`}
                        >
                          <span className="font-semibold">{ev.startTime}</span> {ev.title}
                        </div>
                      );
                    })}
                    {cell.events.length > 2 && (
                      <div className="text-[10px] text-slate-500 font-semibold px-1">
                        +{cell.events.length - 2} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Légende :</span>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Selected Date Details & Upcoming Events (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Date Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="pb-3 border-b border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Journée sélectionnée
              </span>
              <h3 className="text-base font-bold text-[#031B3A]">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "fr-FR",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Aucun événement programmé pour cette journée.
                  </p>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="inline-flex items-center gap-1.5 mx-auto mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[#031B3A] hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Planification de l'administration
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="inline-flex items-center gap-1.5 mx-auto mt-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[#062653] hover:bg-slate-100 border border-[#DCE2EA]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF7900]" />
                      Planifier un événement perso
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {selectedDateEvents.map((ev) => {
                  const cfg = TYPE_CONFIG[ev.type];
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${cfg.bg}`}
                        >
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {ev.startTime} - {ev.endTime}
                            </span>
                          </div>
                          {(isAdmin ||
                            (ev.isPersonal &&
                              ev.creatorEmployeeNumber ===
                                profile?.employeeNumber)) && (
                            <button
                              onClick={(e) => handleDeleteEvent(ev.id, e)}
                              title="Supprimer l'événement"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {ev.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          {ev.isPersonal ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-indigo-700 font-semibold">
                                {ev.personalCategory
                                  ? PERSONAL_CATEGORY_LABELS[ev.personalCategory]
                                  : "Événement personnel (Privé)"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {ev.audienceType === "ALL_EMPLOYEES"
                                  ? "Tous les employés"
                                  : ev.audienceTargetName ||
                                    (ev.audienceType
                                      ? AUDIENCE_LABELS[ev.audienceType]
                                      : "Général")}
                              </span>
                            </>
                          )}
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">
                              {ev.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 text-center border-t border-slate-100">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="inline-flex items-center gap-1.5 mx-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[#031B3A] hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Planification de l'administration
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="inline-flex items-center gap-1.5 mx-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[#062653] hover:bg-slate-100 border border-[#DCE2EA]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF7900]" />
                      Planifier un événement perso
                    </button>
                  )}
                </div>
              </>
            )}
            </div>
          </div>


        </div>
      </div>

      {/* MODAL: Planification d'Événement (Admin: Planification de l'administration | Collaborateur: Événement Personnel) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                isAdmin ? "bg-[#031B3A]" : "bg-[#114C5A]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isAdmin ? (
                  <img
                    src="/icons/sidebar/calendar-white.png"
                    alt=""
                    aria-hidden="true"
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      {isAdmin
                        ? "Planification de l'administration"
                        : "Planifier un événement personnel"}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/20 text-white">
                      {isAdmin ? "Administration" : "Privé"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">
                    {isAdmin
                      ? "Définissez l'événement officiel et les employés à alerter"
                      : "Événement privé — visible uniquement par vous dans votre calendrier"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAdmin
                    ? "Titre de l'événement officiel"
                    : "Titre de l'événement personnel"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isAdmin
                      ? "Ex : Réunion générale d'entreprise, Formation RH..."
                      : "Ex : Rendez-vous médical, Démarche administrative, Rappel..."
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                    isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                  }`}
                />
              </div>

              {/* Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAdmin ? "Type d'événement" : "Catégorie personnelle"}
                  </label>
                  {isAdmin ? (
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as EventType)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#031B3A]"
                    >
                      <option value="MEETING">Réunion d'équipe / Direction</option>
                      <option value="TRAINING">Formation interne / externe</option>
                      <option value="HOLIDAY">Férié / Congé collectif</option>
                      <option value="ANNOUNCEMENT">Annonce officielle</option>
                      <option value="WORKSHOP">Atelier de travail</option>
                    </select>
                  ) : (
                    <select
                      value={personalCategory}
                      onChange={(e) =>
                        setPersonalCategory(e.target.value as PersonalCategory)
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114C5A]"
                    >
                      <option value="RDV">Rendez-vous personnel</option>
                      <option value="REMINDER">Rappel / Mémo</option>
                      <option value="TASK">Tâche personnelle</option>
                      <option value="ADMIN_STEP">Démarche administrative</option>
                      <option value="PERSONAL_LEAVE">
                        Congé / Absence personnelle
                      </option>
                      <option value="OTHER">Autre événement personnel</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                      isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                    }`}
                  />
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                      isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                      isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                    }`}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAdmin
                    ? "Lieu ou Lien de visioconférence"
                    : "Lieu ou Détail (Optionnel)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    isAdmin
                      ? "Ex : Salle de conférence A ou Lien Zoom/Meet"
                      : "Ex : Cabinet, Domicile, Bureau..."
                  }
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                    isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                  }`}
                />
              </div>

              {/* ADMINISTRATION ONLY: AUDIENCE & BROADCAST ALERTS */}
              {isAdmin && (
                <>
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-[#031B3A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#114C5A]" />
                      Employés ciblés / Destinataires de l'alerte
                    </label>

                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === "ALL_EMPLOYEES"}
                          onChange={() => setAudienceType("ALL_EMPLOYEES")}
                          className="text-[#031B3A] focus:ring-[#031B3A]"
                        />
                        <div>
                          <span className="font-semibold text-slate-800">
                            Tous les employés du système
                          </span>
                          <p className="text-xs text-slate-500">
                            Notification diffusée à tous les collaborateurs de l'entreprise
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === "DEPARTMENT"}
                          onChange={() => setAudienceType("DEPARTMENT")}
                          className="text-[#031B3A] focus:ring-[#031B3A]"
                        />
                        <div>
                          <span className="font-semibold text-slate-800">
                            Par département spécifique
                          </span>
                          <p className="text-xs text-slate-500">
                            Ex : Finance, Comptabilité, RH, Opérations, Sécurité...
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === "BRANCH"}
                          onChange={() => setAudienceType("BRANCH")}
                          className="text-[#031B3A] focus:ring-[#031B3A]"
                        />
                        <div>
                          <span className="font-semibold text-slate-800">
                            Par succursale
                          </span>
                          <p className="text-xs text-slate-500">
                            Limité aux collaborateurs rattachés à une agence donnée
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === "CUSTOM"}
                          onChange={() => setAudienceType("CUSTOM")}
                          className="text-[#031B3A] focus:ring-[#031B3A]"
                        />
                        <div>
                          <span className="font-semibold text-slate-800">
                            Groupe d'employés personnalisé
                          </span>
                          <p className="text-xs text-slate-500">
                            Sélection précise par noms ou rôles
                          </p>
                        </div>
                      </label>

                      {audienceType !== "ALL_EMPLOYEES" && (
                        <div className="pt-2">
                          <input
                            type="text"
                            required
                            placeholder={
                              audienceType === "DEPARTMENT"
                                ? "Nom du département (ex : Ressources Humaines)"
                                : audienceType === "BRANCH"
                                ? "Nom de la succursale (ex : Succursale Principale)"
                                : "Noms ou identifiants des employés ciblés"
                            }
                            value={audienceTargetName}
                            onChange={(e) => setAudienceTargetName(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#031B3A]"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyImmediate}
                        onChange={(e) => setNotifyImmediate(e.target.checked)}
                        className="rounded text-[#031B3A] focus:ring-[#031B3A]"
                      />
                      <span>
                        Alerter immédiatement par notification dans le système et par courriel
                      </span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminder24h}
                        onChange={(e) => setReminder24h(e.target.checked)}
                        className="rounded text-[#031B3A] focus:ring-[#031B3A]"
                      />
                      <span>
                        Envoyer un rappel automatique 24 heures avant l'événement
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* COLLABORATOR ONLY: Personal reminder */}
              {!isAdmin && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminder24h}
                      onChange={(e) => setReminder24h(e.target.checked)}
                      className="rounded text-[#114C5A] focus:ring-[#114C5A]"
                    />
                    <span>
                      M'envoyer un rappel automatique avant cet événement
                    </span>
                  </label>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAdmin
                    ? "Description / Ordre du jour"
                    : "Notes personnelles / Détails"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    isAdmin
                      ? "Détails, ordre du jour ou instructions particulières..."
                      : "Notes pour vous-même, détails, instructions..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${
                    isAdmin ? "focus:ring-[#031B3A]" : "focus:ring-[#114C5A]"
                  }`}
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors cursor-pointer ${
                    isAdmin
                      ? "bg-[#031B3A] hover:bg-[#042854]"
                      : "bg-[#114C5A] hover:bg-[#0d3b46]"
                  }`}
                >
                  {isAdmin ? "Enregistrer et Alerter" : "Enregistrer mon événement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
