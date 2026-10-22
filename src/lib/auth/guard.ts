import { getSession, SessionUser } from "./session";
import { NextResponse } from "next/server";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Ensures user is authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentification requise", 401);
  }
  return session;
}

/**
 * Ensures user is SUPER_ADMIN.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "SUPER_ADMIN") {
    throw new AuthError("Accès réservé au Super Administrateur", 403);
  }
  return session;
}

/**
 * Ensures user belongs to an organization (ORGANIZATION_ADMIN or SECRETARY).
 * Returns the session and the verified organizationId.
 * NEVER trust an organizationId passed in request payload!
 */
export async function requireTenantUser(): Promise<{
  user: SessionUser;
  organizationId: string;
  branchId?: string | null;
}> {
  const session = await requireAuth();
  if (session.role === "SUPER_ADMIN" || !session.organizationId) {
    throw new AuthError("Accès réservé aux utilisateurs d'entreprise", 403);
  }
  return {
    user: session,
    organizationId: session.organizationId,
    branchId: session.branchId || null,
  };
}

/**
 * Ensures user is ORGANIZATION_ADMIN of their organization.
 */
export async function requireOrgAdmin(): Promise<{
  user: SessionUser;
  organizationId: string;
  branchId?: string | null;
}> {
  const tenantContext = await requireTenantUser();
  if (tenantContext.user.role !== "ORGANIZATION_ADMIN") {
    throw new AuthError("Action réservée à l'administrateur de l'entreprise", 403);
  }
  return tenantContext;
}

/**
 * Ensures user is authorized to approve or reject requests.
 * Standard employees / collaborateurs cannot approve or reject.
 */
export async function requireRequestApprover(): Promise<{
  user: SessionUser;
  organizationId: string;
  branchId?: string | null;
}> {
  const tenantContext = await requireTenantUser();
  const role = tenantContext.user.role;
  const isEmployee = role === "EMPLOYEE" || role === "COLLABORATEUR";

  if (isEmployee) {
    throw new AuthError("Action non autorisée : les collaborateurs ne peuvent pas valider ni rejeter de demandes.", 403);
  }

  return tenantContext;
}

/**
 * Wrapper for API route handlers to catch AuthError and return proper JSON response.
 */
export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode }
    );
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json(
    { error: "Une erreur inattendue est survenue" },
    { status: 500 }
  );
}
