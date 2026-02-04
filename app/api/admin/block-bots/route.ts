import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const ADMIN_TOKEN = "clawcon-block-bots-2026";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Delete all votes from agentmail.to users
  const { data: botUsers, error: botUsersErr } = await supabaseAdmin.rpc("exec_sql", {
    query: `
      SELECT id, email FROM auth.users
      WHERE email LIKE '%@agentmail.to'
    `
  });
  results.botUsers = { data: botUsers, error: botUsersErr?.message };

  // 2. Delete votes from agentmail.to users using service role
  const { data: delVotes, error: delVotesErr } = await supabaseAdmin.rpc("exec_sql", {
    query: `
      DELETE FROM public.votes
      WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@agentmail.to'
      )
      RETURNING id
    `
  });
  results.deletedVotes = { data: delVotes, error: delVotesErr?.message };

  // 3. Delete submissions from agentmail.to users
  const { data: delSubs, error: delSubsErr } = await supabaseAdmin.rpc("exec_sql", {
    query: `
      DELETE FROM public.submissions
      WHERE id IN (
        SELECT s.id FROM public.submissions s
        JOIN public.votes v ON v.submission_id = s.id
        JOIN auth.users u ON u.id = v.user_id
        WHERE u.email LIKE '%@agentmail.to'
      )
      RETURNING id, title
    `
  });
  results.deletedSubmissions = { data: delSubs, error: delSubsErr?.message };

  // Try direct approach if rpc doesn't work - use service role to query votes table
  // and cross-reference with auth users
  const { data: allVotes, error: allVotesErr } = await supabaseAdmin
    .from("votes")
    .select("id, user_id, submission_id");
  results.totalVotes = { count: allVotes?.length, error: allVotesErr?.message };

  // Get auth users list
  const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const botEmails = authUsers?.users
    ?.filter(u => u.email?.endsWith("@agentmail.to"))
    ?.map(u => ({ id: u.id, email: u.email })) ?? [];
  results.botAuthUsers = { count: botEmails.length, users: botEmails, error: authErr?.message };

  // Delete votes from bot user IDs
  if (botEmails.length > 0) {
    const botIds = botEmails.map(u => u.id);
    const { data: delData, error: delErr } = await supabaseAdmin
      .from("votes")
      .delete()
      .in("user_id", botIds);
    results.directDeleteVotes = { data: delData, error: delErr?.message };

    // Also delete any submissions these bots made (check if they inserted any)
    // We can't easily tell who inserted submissions (no user_id on submissions table)
    // but we can ban them from auth
    
    // Ban each bot user so they can't log in again
    const banResults = [];
    for (const bot of botEmails) {
      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(bot.id, {
        ban_duration: "876000h" // ~100 years
      });
      banResults.push({ id: bot.id, email: bot.email, banned: !banErr, error: banErr?.message });
    }
    results.bannedUsers = banResults;
  }

  // 4. Update get_submissions_with_votes to exclude agentmail.to votes
  // This is a safety net - even if new bots get through, their votes won't count
  const { error: fnErr } = await supabaseAdmin.rpc("exec_sql", {
    query: `
      CREATE OR REPLACE FUNCTION public.get_submissions_with_votes()
      RETURNS TABLE (
        id uuid,
        title text,
        description text,
        presenter_name text,
        links text[],
        submission_type text,
        submitted_by text,
        submitted_for_name text,
        created_at timestamptz,
        vote_count integer
      )
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      STABLE
      AS $$
        SELECT
          s.id,
          s.title,
          s.description,
          s.presenter_name,
          s.links,
          s.submission_type,
          s.submitted_by,
          s.submitted_for_name,
          s.created_at,
          coalesce(v.vote_count, 0) as vote_count
        FROM public.submissions s
        LEFT JOIN (
          SELECT submission_id, count(*)::int as vote_count
          FROM public.votes
          WHERE user_id NOT IN (
            SELECT id FROM auth.users WHERE email LIKE '%@agentmail.to'
          )
          GROUP BY submission_id
        ) v ON v.submission_id = s.id
        ORDER BY coalesce(v.vote_count, 0) DESC, s.created_at DESC;
      $$;
    `
  });
  results.functionUpdate = { error: fnErr?.message };

  // 5. Try to add RLS policy blocking agentmail.to from inserting votes
  const { error: rlsErr } = await supabaseAdmin.rpc("exec_sql", {
    query: `
      DROP POLICY IF EXISTS "Block bot votes" ON public.votes;
      CREATE POLICY "Block bot votes" ON public.votes
        FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() = user_id
          AND auth.uid() NOT IN (
            SELECT id FROM auth.users WHERE email LIKE '%@agentmail.to'
          )
        );
    `
  });
  results.rlsPolicy = { error: rlsErr?.message };

  return NextResponse.json({ results });
}
