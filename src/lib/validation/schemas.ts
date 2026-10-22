import { z } from "zod";

// ----------------------------------------------------
// AUTH SCHEMAS
// ----------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ----------------------------------------------------
// LEAVE REQUEST SCHEMAS
// ----------------------------------------------------
export const leaveTypeEnum = z.enum([
  "ANNUAL",
  "SICK",
  "UNPAID",
  "MATERNITY_PATERNITY",
  "OTHER",
]);

export const submitLeaveRequestSchema = z
  .object({
    organizationId: z.string().min(1, "L'organisation est obligatoire"),
    firstName: z.string().trim().min(2, "Le prénom est obligatoire"),
    lastName: z.string().trim().min(2, "Le nom est obligatoire"),
    employeeNumber: z.string().trim().min(1, "Le numéro d'employé est obligatoire"),
    department: z.string().trim().min(2, "Le département est obligatoire"),
    position: z.string().trim().min(2, "Le poste est obligatoire"),
    leaveType: leaveTypeEnum,
    leaveTypeOther: z.string().trim().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date de début invalide (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date de fin invalide (YYYY-MM-DD)"),
    requestedDays: z.number().int().positive("Le nombre de jours doit être supérieur à 0"),
    replacementName: z.string().trim().optional().nullable(),
    contactPhone: z
      .string()
      .trim()
      .refine(
        (val) => {
          const digits = val.replace(/\D/g, "");
          return digits.length >= 8;
        },
        {
          message: "Le numéro de téléphone (WhatsApp) doit comporter au moins 8 chiffres",
        }
      ),
    contactEmail: z.string().trim().email("Adresse email invalide").optional().or(z.literal("")),
    turnstileToken: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.leaveType === "OTHER") {
        return !!data.leaveTypeOther && data.leaveTypeOther.trim().length > 0;
      }
      return true;
    },
    {
      message: "Veuillez préciser le motif lorsque vous sélectionnez 'Autre'",
      path: ["leaveTypeOther"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "La date de fin doit être égale ou postérieure à la date de début",
      path: ["endDate"],
    }
  );

export type SubmitLeaveRequestInput = z.infer<typeof submitLeaveRequestSchema>;

export const approveLeaveRequestSchema = z.object({
  decisionComment: z.string().trim().optional(),
  signatureUrl: z.string().optional(),
});

export const rejectLeaveRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, "La raison du refus est obligatoire et doit comporter au moins 3 caractères"),
  decisionComment: z.string().trim().optional(),
});

// ----------------------------------------------------
// ORGANIZATION SCHEMAS
// ----------------------------------------------------
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Le nom de l'entreprise est obligatoire"),
  slug: z
    .string()
    .trim()
    .min(2, "Le slug est obligatoire")
    .regex(/^[a-z0-9-]+$/, "Le slug ne doit contenir que des minuscules, chiffres et tirets"),
  logoUrl: z.string().trim().url("URL du logo invalide").optional().or(z.literal("")),
  email: z.string().trim().email("Email d'entreprise invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  adminName: z.string().trim().min(2, "Le nom de l'administrateur est obligatoire"),
  adminEmail: z.string().trim().email("Email de l'administrateur invalide"),
  adminPassword: z.string().min(8, "Le mot de passe admin doit contenir au moins 8 caractères"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Le nom de l'entreprise est obligatoire"),
  logoUrl: z.string().trim().url("URL du logo invalide").optional().or(z.literal("")),
  email: z.string().trim().email("Email d'entreprise invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

// ----------------------------------------------------
// EMPLOYEE SCHEMAS
// ----------------------------------------------------
export const employeeSchema = z.object({
  employeeNumber: z.string().trim().min(1, "Le numéro d'employé est obligatoire"),
  branchId: z.string().trim().optional().nullable(),
  firstName: z.string().trim().min(2, "Le prénom est obligatoire"),
  lastName: z.string().trim().min(2, "Le nom est obligatoire"),
  department: z.string().trim().optional().nullable(),
  position: z.string().trim().optional().nullable(),
  phone: z.string().trim().min(6, "Le numéro de téléphone est obligatoire"),
  email: z.string().trim().email("Adresse email invalide").min(1, "L'adresse email est obligatoire"),
  birthDate: z.string().trim().optional().nullable(),
  studyDomain: z.string().trim().optional().nullable(),
  bloodGroup: z.string().trim().optional().nullable(),
  medicalNotes: z.string().trim().optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactRelation: z.string().trim().optional().nullable(),
  emergencyContactPhone: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  role: z.string().trim().optional().nullable(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

// ----------------------------------------------------
// USER SCHEMAS (Org Users)
// ----------------------------------------------------
export const createOrgUserSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.string().min(1, "Le rôle est obligatoire"),
  branchId: z.string().trim().optional().nullable(),
});

export type CreateOrgUserInput = z.infer<typeof createOrgUserSchema>;

// ----------------------------------------------------
// BRANCH SCHEMAS
// ----------------------------------------------------
export const branchSchema = z.object({
  code: z.string().trim().min(2, "Le code succursale est obligatoire"),
  name: z.string().trim().min(2, "Le nom de la succursale est obligatoire"),
  city: z.string().trim().min(2, "La ville est obligatoire"),
  address: z.string().trim().optional().nullable(),
  managerName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type BranchInput = z.infer<typeof branchSchema>;
