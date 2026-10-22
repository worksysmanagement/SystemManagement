import { NextRequest, NextResponse } from "next/server";
import { requireRequestApprover, handleApiError } from "@/lib/auth/guard";
import { rejectLeaveRequest } from "@/lib/services/leave-requests";
import { rejectLeaveRequestSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organizationId } = await requireRequestApprover();
    const { id } = await params;

    const body = await req.json();
    const parseResult = rejectLeaveRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "La raison du refus est obligatoire",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { rejectionReason, decisionComment } = parseResult.data;

    const result = await rejectLeaveRequest(
      id,
      organizationId,
      user.id,
      rejectionReason,
      decisionComment
    );

    return NextResponse.json({
      success: true,
      leaveRequest: result.leaveRequest,
    });
  } catch (err: any) {
    if (err?.message?.includes("n'est plus en attente")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}
