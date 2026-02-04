import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== "clawcon-audit-2026-02-04") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Get all agentmail user IDs
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const agentmailUsers = (users?.users || []).filter(u => u.email?.endsWith("@agentmail.to"));
    const agentmailIds = agentmailUsers.map(u => u.id);

    // Get all submissions with current vote counts
    const { data: submissions } = await supabaseAdmin.rpc("get_submissions_with_votes");

    // Check if any agentmail users submitted anything
    const { data: agentSubmissions } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .in("submitted_by", ["human", "bot"])

    // Check remaining votes by agentmail users (should be 0 now)
    const { data: remainingVotes } = await supabaseAdmin
      .from("votes")
      .select("submission_id, user_id")
      .in("user_id", agentmailIds.length > 0 ? agentmailIds : ["none"]);

    return NextResponse.json({
      agentmailAccounts: agentmailUsers.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })),
      remainingVotesFromAgentmail: remainingVotes || [],
      allSubmissions: submissions || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
