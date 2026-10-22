import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listLeaveRequests, createLeaveRequest } from "@/lib/services/leave-requests";
import { getTenantDashboardMetrics } from "@/lib/services/audit";

export async function GET(req: NextRequest) {
  try {
    const { organizationId, user } = await requireTenantUser();

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Quick metrics endpoint for dashboard
    if (mode === "metrics") {
      const metrics = await getTenantDashboardMetrics(organizationId);
      return NextResponse.json({ metrics });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = (searchParams.get("status") as any) || "ALL";
    const search = searchParams.get("search") || undefined;
    const requestedEmpNum = searchParams.get("employeeNumber") || undefined;
    const requestedEmail = searchParams.get("contactEmail") || undefined;

    const isEmployee =
      user.role === "EMPLOYEE" ||
      user.role?.toLowerCase().includes("employ") ||
      user.role?.toLowerCase().includes("collab");

    const result = await listLeaveRequests(organizationId, {
      page,
      limit,
      status,
      search,
      employeeNumber: isEmployee ? (requestedEmpNum || undefined) : requestedEmpNum,
      contactEmail: isEmployee ? (user.email || requestedEmail) : requestedEmail,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, user } = await requireTenantUser();
    const body = await req.json();

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const result = await createLeaveRequest(
      {
        ...body,
        organizationId,
        contactEmail: body.contactEmail || user.email,
      },
      { ip, userAgent }
    );

    return NextResponse.json({
      success: true,
      leaveRequest: result.leaveRequest,
      accessToken: result.rawAccessToken,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
