import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  // One-time cleanup token
  const token = req.nextUrl.searchParams.get("token");
  if (token !== "clawcon-cleanup-2026-02-04") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Find users with agentmail.to emails
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const agentmailUsers = users.users.filter(u => u.email?.endsWith("@agentmail.to"));
    const userIds = agentmailUsers.map(u => u.id);

    if (userIds.length === 0) {
      return NextResponse.json({ message: "No agentmail.to users found", deleted: 0 });
    }

    // Delete their votes
    const { error } = await supabaseAdmin
      .from("votes")
      .delete()
      .in("user_id", userIds);

    if (error) throw error;

    return NextResponse.json({
      message: `Cleaned up votes from ${agentmailUsers.length} agentmail.to accounts`,
      emails: agentmailUsers.map(u => u.email),
      userIds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
