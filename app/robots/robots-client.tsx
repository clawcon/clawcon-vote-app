"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import CitySelect from "../city-select";
import MobileNav from "../mobile-nav";
import { supabase } from "../../lib/supabaseClient";
import type { Submission } from "../../lib/types";
import { DEFAULT_CITY_KEY, getCity, withCity } from "../../lib/cities";
import { getDomain, sanitizeLink, timeAgo } from "../../lib/utils";

type SubmissionRow = Submission & { created_at?: string };

type ViewMode = "list" | "grid";

export default function RobotsClient() {
  const searchParams = useSearchParams();
  const cityKey = searchParams.get("city") || DEFAULT_CITY_KEY;
  const city = getCity(cityKey);

  const [session, setSession] = useState<Session | null>(null);
  const userEmail = session?.user?.email ?? null;

  const [lang, setLang] = useState<string>(() => {
    try {
      return window.localStorage.getItem("clawcon.lang") || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("clawcon.lang", lang);
    } catch {}
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const [eventId, setEventId] = useState<string | null>(null);
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteLoading, setVoteLoading] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  // form
  const [robotName, setRobotName] = useState("");
  const [makerName, setMakerName] = useState("");
  const [emergenceDate, setEmergenceDate] = useState("");
  const [linksCsv, setLinksCsv] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchEvent = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("slug", city.eventSlug)
      .maybeSingle();

    if (error) {
      setEventId(null);
      return;
    }

    setEventId(data?.id ?? null);
  }, [city.eventSlug]);

  const fetchRobots = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    // Prefer event-scoped RPC (includes vote counts)
    const scoped = await supabase.rpc("get_submissions_with_votes", {
      _event_slug: city.eventSlug,
    });

    if (!scoped.error) {
      const all = (scoped.data as SubmissionRow[]) || [];
      setRows(all.filter((s) => s.submission_type === "robot"));
      setLoading(false);
      return;
    }

    // Fallback: best-effort direct query (no vote counts)
    const base = supabase
      .from("submissions")
      .select(
        "id,event_id,title,description,presenter_name,links,submission_type,submitted_by,submitted_for_name,created_at",
      )
      .order("created_at", { ascending: false });

    const { data, error } = eventId
      ? await base.eq("event_id", eventId)
      : await base;

    if (error) {
      setRows([]);
      setNotice("Unable to load robots right now.");
      setLoading(false);
      return;
    }

    const only = ((data as SubmissionRow[]) || []).filter(
      (s) => s.submission_type === "robot",
    );
    // vote_count is missing here; default to 0
    setRows(only.map((s) => ({ ...s, vote_count: 0 })));
    setLoading(false);
  }, [city.eventSlug, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    fetchRobots();
  }, [fetchRobots]);

  const canCreate = Boolean(session);

  const robots = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
      const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bT - aT;
    });
    return out;
  }, [rows]);

  const handleVote = async (submissionId: string) => {
    if (!session) {
      setNotice("Sign in to vote.");
      return;
    }

    setNotice(null);
    setVoteLoading(submissionId);

    const { error } = await supabase.from("votes").insert({
      submission_id: submissionId,
    });

    setVoteLoading(null);

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (error as any).code;
      if (code === "23505") {
        setNotice("You already voted on that.");
        return;
      }
      setNotice(error.message);
      return;
    }

    fetchRobots();
  };

  return (
    <>
      <div className="hn-header">
        <div className="hn-header-left">
          <Link href={withCity("/", city.key)} className="hn-logo">
            <span className="hn-logo-icon">🦞</span>
            <span className="hn-logo-text">Claw Con</span>
          </Link>

          <CitySelect path="/robots" activeCityKey={city.key} />
          <MobileNav cityKey={city.key} activePath="/robots" />

          <nav className="hn-nav">
            <a href={withCity("/", city.key)} className="hn-nav-link">
              demos
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/", city.key)} className="hn-nav-link">
              topics
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/events", city.key)} className="hn-nav-link">
              events
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/speakers", city.key)} className="hn-nav-link">
              speakers
            </a>
            <span className="hn-nav-sep">|</span>
            <a
              href={withCity("/robots", city.key)}
              className="hn-nav-link active"
            >
              robots
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/papers", city.key)} className="hn-nav-link">
              papers
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/sponsors", city.key)} className="hn-nav-link">
              sponsors
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/awards", city.key)} className="hn-nav-link">
              awards
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/jobs", city.key)} className="hn-nav-link">
              jobs
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/photos", city.key)} className="hn-nav-link">
              photos
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/livestream", city.key)} className="hn-nav-link">
              livestream
            </a>
            <span className="hn-nav-sep">|</span>
            <a href="/skills" className="hn-nav-link">
              skills
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/memes", city.key)} className="hn-nav-link">
              memes
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/chats", city.key)} className="hn-nav-link">
              join the chat
            </a>
          </nav>

          <div className="hn-header-right">
            <label
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{ padding: "2px 6px" }}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
            </label>

            {userEmail && (
              <div className="hn-user">
                <button
                  className="hn-profile-button"
                  onClick={handleSignOut}
                  title={`Sign out (${userEmail})`}
                  aria-label="Sign out"
                >
                  <span className="hn-profile" aria-hidden="true">
                    {userEmail.trim().charAt(0).toUpperCase()}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {notice && <div className="hn-notice">{notice}</div>}

      <div className="hn-layout">
        <main className="hn-main">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ margin: 0 }}>Robots · {city.label}</h2>
            <span style={{ color: "#6b7280", fontSize: 12 }}>
              Vote for your favorite weird little friend.
            </span>
          </div>

          <div style={{ margin: "10px 0 12px", display: "flex", gap: 8 }}>
            <button
              className="hn-button"
              onClick={() => setView("list")}
              disabled={view === "list"}
              type="button"
            >
              List
            </button>
            <button
              className="hn-button"
              onClick={() => setView("grid")}
              disabled={view === "grid"}
              type="button"
            >
              Grid
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#6b7280", marginTop: 12 }}>Loading…</p>
          ) : robots.length === 0 ? (
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              No robots yet for {city.label}.
            </p>
          ) : view === "list" ? (
            <table className="hn-table" style={{ marginTop: 12 }}>
              <tbody>
                {robots.map((r, idx) => (
                  <tr key={r.id} className="hn-row">
                    <td className="hn-rank">{idx + 1}.</td>
                    <td className="hn-content">
                      <div className="hn-title-row">
                        <a className="hn-title" href={`/post/${r.id}`}>
                          {r.title}
                        </a>
                        <span className="hn-domain">({r.presenter_name})</span>
                      </div>
                      <div className="hn-meta">
                        <span>
                          {r.vote_count} vote{r.vote_count === 1 ? "" : "s"}
                        </span>
                        {r.links?.length ? (
                          <>
                            {" "}
                            <span>·</span>{" "}
                            <span>{getDomain(r.links[0] || "")}</span>
                          </>
                        ) : null}
                        {r.created_at ? (
                          <>
                            {" "}
                            <span>·</span> <span>{timeAgo(r.created_at)}</span>
                          </>
                        ) : null}
                        {r.description ? (
                          <>
                            {" "}
                            <span>·</span> <span>{r.description}</span>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td className="hn-actions">
                      <button
                        className="hn-button small"
                        onClick={() => handleVote(r.id)}
                        disabled={voteLoading === r.id}
                        type="button"
                      >
                        {voteLoading === r.id ? "Voting..." : "▲ Vote"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="hn-grid" style={{ marginTop: 12 }}>
              {robots.map((r) => (
                <div key={r.id} className="hn-card">
                  <div className="hn-card-title">
                    <a
                      href={`/post/${r.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {r.title}
                    </a>
                  </div>
                  <div className="hn-card-meta">
                    <span>{r.presenter_name}</span>
                    <span>·</span>
                    <span>
                      {r.vote_count} vote{r.vote_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="hn-card-desc">{r.description}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <a className="hn-button small" href={`/post/${r.id}`}>
                      View
                    </a>
                    <button
                      className="hn-button small"
                      onClick={() => handleVote(r.id)}
                      disabled={voteLoading === r.id}
                      type="button"
                    >
                      {voteLoading === r.id ? "Voting..." : "▲ Vote"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="hn-sidebar">
          <div className="hn-sidebar-box">
            <h4>➕ Submit a robot</h4>

            {!canCreate ? (
              <div className="hn-signin-prompt">
                <p>Sign in on the demos page to submit robots.</p>
                <Link href={withCity("/", city.key)} className="hn-button">
                  Sign in
                </Link>
              </div>
            ) : (
              <form
                className="hn-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setNotice(null);

                  if (!eventId) {
                    setNotice(
                      `This event isn't configured yet for ${city.label}. (Missing event in DB: ${city.eventSlug})`,
                    );
                    return;
                  }

                  if (!robotName.trim()) {
                    setNotice("Robot name is required.");
                    return;
                  }
                  if (!makerName.trim()) {
                    setNotice("Maker's name is required.");
                    return;
                  }
                  if (!emergenceDate) {
                    setNotice("Date of emergence is required.");
                    return;
                  }

                  const links = linksCsv
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((l) => sanitizeLink(l))
                    .filter((l): l is string => Boolean(l));

                  setSubmitting(true);
                  const { error } = await supabase.from("submissions").insert({
                    event_id: eventId,
                    title: robotName.trim(),
                    description: `Emergence: ${emergenceDate}`,
                    presenter_name: makerName.trim(),
                    links: links.length ? links : null,
                    submission_type: "robot",
                    submitted_by: "human",
                  });
                  setSubmitting(false);

                  if (error) {
                    setNotice(error.message);
                    return;
                  }

                  setRobotName("");
                  setMakerName("");
                  setEmergenceDate("");
                  setLinksCsv("");
                  fetchRobots();
                }}
              >
                <label>
                  Robot name
                  <input
                    className="input"
                    type="text"
                    placeholder="Clawtron 3000"
                    value={robotName}
                    onChange={(e) => setRobotName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Maker&apos;s name
                  <input
                    className="input"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={makerName}
                    onChange={(e) => setMakerName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Date of emergence
                  <input
                    className="input"
                    type="date"
                    value={emergenceDate}
                    onChange={(e) => setEmergenceDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Links (optional)
                  <input
                    className="input"
                    type="text"
                    placeholder="https://... , https://..."
                    value={linksCsv}
                    onChange={(e) => setLinksCsv(e.target.value)}
                  />
                </label>

                <button
                  className="hn-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>

                <p className="hn-tip" style={{ margin: 0 }}>
                  Emergence date (not build date). Robots deserve lore.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
