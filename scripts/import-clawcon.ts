#!/usr/bin/env tsx

/**
 * Import demos + topics from https://www.claw-con.com into this app's Supabase `submissions` table.
 *
 * Usage:
 *   pnpm tsx scripts/import-clawcon.ts --dry-run
 *   pnpm tsx scripts/import-clawcon.ts --commit
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

type SubmissionType = "speaker_demo" | "topic";

type SourceSubmission = {
  title: string;
  description: string;
  presenter_name: string;
  links: string[] | null;
  submission_type: SubmissionType;
  is_openclaw_contributor: boolean;
};

function argHas(flag: string) {
  return process.argv.includes(flag);
}

function argValue(key: string): string | null {
  const idx = process.argv.indexOf(key);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const SOURCE_BASE = argValue("--source") || "https://www.claw-con.com";
const MODE: "dry" | "commit" = argHas("--commit") ? "commit" : "dry";
const LIMIT = Number(argValue("--limit") || "0") || null;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "clawcon-vote-app importer (contact: Colin)",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function parseSourceSupabaseFromBundle(js: string): {
  url: string;
  anonKey: string;
} {
  // Look for: new ru("https://<ref>.supabase.co","<jwt>",...
  const m = js.match(
    /new ru\(\"(https:\/\/[a-z0-9]+\.supabase\.co)\",\"(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\"/,
  );
  if (!m) {
    // fallback: allow plain quotes
    const m2 = js.match(
      /new ru\(\"(https:\/\/[a-z0-9]+\.supabase\.co)\",\"(eyJ[^\"\\]+)\"/,
    );
    if (!m2)
      throw new Error(
        "Could not locate source Supabase URL + anon key in bundle.",
      );
    return { url: m2[1]!, anonKey: m2[2]! };
  }
  if (!m) throw new Error("Could not locate source Supabase URL + anon key in bundle.");
  return { url: m[1]!, anonKey: m[2]! };
}

async function discoverSourceSupabase(): Promise<{ url: string; anonKey: string }> {
  const html = await fetchText(`${SOURCE_BASE}/`);
  const dpl = html.match(/dpl=[^\"']+/)?.[0] || "";
  const chunkIds = Array.from(
    new Set(
      Array.from(html.matchAll(/\/_next\/static\/chunks\/([a-f0-9]+)\.js\?dpl=/gi)).map(
        (m) => m[1]!,
      ),
    ),
  );

  if (chunkIds.length === 0)
    throw new Error("Could not find Next chunk URLs on source homepage.");

  for (const id of chunkIds) {
    const chunkUrl = `${SOURCE_BASE}/_next/static/chunks/${id}.js?${dpl}`;
    const js = await fetchText(chunkUrl);
    try {
      return parseSourceSupabaseFromBundle(js);
    } catch {
      // keep trying
    }
  }

  throw new Error("Could not locate source Supabase URL + anon key in any chunk.");
}

async function fetchAllSourceSubmissions(source: {
  url: string;
  anonKey: string;
}): Promise<SourceSubmission[]> {
  const supabase = createClient(source.url, source.anonKey, {
    auth: { persistSession: false },
  });

  const out: SourceSubmission[] = [];
  const pageSize = 1000;

  for (let offset = 0; offset < 20000; offset += pageSize) {
    const { data, error } = await supabase
      .rpc("get_submissions_with_votes")
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const rows = ((data as any[]) || []).map((r) => ({
      title: r.title,
      description: r.description,
      presenter_name: r.presenter_name,
      links: r.links ?? null,
      submission_type: r.submission_type,
      is_openclaw_contributor: !!r.is_openclaw_contributor,
    })) as SourceSubmission[];

    out.push(...rows);
    if (rows.length < pageSize) break;
  }

  return out;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (MODE === "commit") {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env (required for --commit).",
      );
    }
  }

  const sourceSb = await discoverSourceSupabase();
  const sourceRows = await fetchAllSourceSubmissions(sourceSb);

  const filtered = sourceRows.filter(
    (r) => r.submission_type === "speaker_demo" || r.submission_type === "topic",
  );

  const finalRows = LIMIT ? filtered.slice(0, LIMIT) : filtered;

  console.log(
    JSON.stringify(
      {
        source: SOURCE_BASE,
        mode: MODE,
        sourceSupabase: { url: sourceSb.url },
        found: { total: sourceRows.length, filtered: filtered.length },
        importing: finalRows.length,
        sample: finalRows.slice(0, 3),
      },
      null,
      2,
    ),
  );

  // De-dupe by (title, presenter, type)
  const key = (p: SourceSubmission) =>
    `${p.submission_type}::${p.presenter_name}::${p.title}`.toLowerCase();
  const dedupMap = new Map<string, SourceSubmission>();
  for (const p of finalRows) dedupMap.set(key(p), p);
  const deduped = Array.from(dedupMap.values());

  console.log(`Deduped to ${deduped.length} rows.`);

  if (MODE === "dry") {
    console.log(`\nDry run only. Re-run with --commit to insert into Supabase.`);
    return;
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false },
  });

  // Load existing rows to avoid duplicates.
  const { data: existing, error: existingErr } = await supabase
    .from("submissions")
    .select("id,title,presenter_name,submission_type")
    .limit(5000);

  if (existingErr) throw existingErr;

  const existingKeys = new Set(
    (existing || []).map((r) =>
      `${r.submission_type}::${r.presenter_name}::${r.title}`.toLowerCase(),
    ),
  );

  const toInsert = deduped.filter((p) => !existingKeys.has(key(p)));

  console.log(
    `Will insert ${toInsert.length} new submissions (skipping duplicates).`,
  );

  if (toInsert.length === 0) return;

  const payload = toInsert.map((p) => ({
    title: p.title,
    description: p.description,
    presenter_name: p.presenter_name,
    links: p.links && p.links.length ? p.links : null,
    submission_type: p.submission_type,
    submitted_by: "bot" as const,
    submitted_for_name: null,
    is_openclaw_contributor: !!p.is_openclaw_contributor,
  }));

  const { error: insErr } = await supabase.from("submissions").insert(payload);
  if (insErr) throw insErr;

  console.log("Inserted successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
