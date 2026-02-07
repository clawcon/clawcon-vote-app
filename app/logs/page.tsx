"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { DEFAULT_CITY_KEY } from "../../lib/cities";

type VoteRow = {
  id: string;
  created_at: string;
  submission_id: string;
};

type SubmissionRow = {
  id: string;
  created_at: string;
  title: string;
  presenter_name: string;
  submission_type: string;
};

export default function LogsPage() {
  const [cityKey, setCityKey] = useState<string>(DEFAULT_CITY_KEY);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      setCityKey(url.searchParams.get("city") || DEFAULT_CITY_KEY);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setError(null);

      // Map cityKey -> event slug (via existing constant used throughout the app)
      // For now we derive the event slug by asking the events table.
      const ev = await supabase
        .from("events")
        .select("slug")
        .eq("slug", cityKey)
        .maybeSingle();

      // If the cityKey isn't literally the event slug, fall back to reading it from the page URL
      // (the rest of the app uses lib/cities, but logs is intentionally simple).
      const eventSlug = ev.data?.slug || cityKey;

      const subs = await supabase.rpc("get_public_recent_submissions", {
        _event_slug: eventSlug,
        _limit: 200,
      });

      if (subs.error) {
        setError(subs.error.message);
        return;
      }
      setSubmissions((subs.data as any) || []);

      const v = await supabase.rpc("get_public_recent_votes", {
        _event_slug: eventSlug,
        _limit: 200,
      });

      if (v.error) {
        setError(v.error.message);
        return;
      }
      setVotes((v.data as any) || []);
    })();
  }, [cityKey]);

  const voteCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const vote of votes) {
      m.set(vote.submission_id, (m.get(vote.submission_id) || 0) + 1);
    }
    return m;
  }, [votes]);

  return (
    <div className="oc-stack">
      <div className="oc-row-between">
        <h2 className="oc-h2">Logs</h2>
        <div className="oc-pill">city={cityKey}</div>
      </div>

      {error && <div className="oc-notice error">{error}</div>}

      <div className="oc-grid-2">
        <div className="oc-card">
          <div className="oc-card-title">Recent submissions</div>
          <div className="oc-table">
            <div className="oc-table-head">
              <div>When</div>
              <div>Type</div>
              <div>Title</div>
              <div>Votes</div>
            </div>
            {submissions.map((s) => (
              <div key={s.id} className="oc-table-row">
                <div className="oc-mono oc-muted">
                  {new Date(s.created_at).toLocaleString()}
                </div>
                <div className="oc-pill small">{s.submission_type}</div>
                <div>
                  <div className="oc-strong">{s.title}</div>
                  <div className="oc-muted">{s.presenter_name}</div>
                </div>
                <div className="oc-mono">{voteCounts.get(s.id) || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="oc-card">
          <div className="oc-card-title">Recent votes</div>
          <div className="oc-table">
            <div className="oc-table-head">
              <div>When</div>
              <div>Submission</div>
              <div>User</div>
            </div>
            {votes.map((v) => (
              <div key={v.id} className="oc-table-row">
                <div className="oc-mono oc-muted">
                  {new Date(v.created_at).toLocaleString()}
                </div>
                <div className="oc-mono">{v.submission_id}</div>
                <div className="oc-mono oc-muted">anon</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="oc-muted">
        Public read-only logs. Votes are anonymized.
      </div>
    </div>
  );
}
