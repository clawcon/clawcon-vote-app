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

export type SubmissionTypeKey = Submission["submission_type"];

export type SubmitField =
  | {
      key: string;
      label: string;
      placeholder?: string;
      required?: boolean;
      kind: "text";
    }
  | {
      key: string;
      label: string;
      placeholder?: string;
      required?: boolean;
      kind: "textarea";
      rows?: number;
    }
  | {
      key: string;
      label: string;
      required?: boolean;
      kind: "date";
    };

export default function SubmissionsPage(props: {
  title: string;
  subtitle: string;
  activePath: string;
  activeNavLabel: string;
  submissionType: SubmissionTypeKey;
  formTitle: string;
  fields: SubmitField[];
  buildInsert: (
    state: Record<string, string>,
    cityLabel: string,
  ) => {
    title: string;
    description: string;
    presenter_name: string;
    links: string[] | null;
  };
}) {
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
  const [rows, setRows] = useState<(Submission & { created_at?: string })[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteLoading, setVoteLoading] = useState<string | null>(null);

  const [state, setState] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    for (const f of props.fields) s[f.key] = "";
    return s;
  });

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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    const scoped = await supabase.rpc("get_submissions_with_votes", {
      _event_slug: city.eventSlug,
    });

    if (!scoped.error) {
      const all =
        (scoped.data as (Submission & { created_at?: string })[]) || [];
      setRows(all.filter((s) => s.submission_type === props.submissionType));
      setLoading(false);
      return;
    }

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
      setNotice(`Unable to load ${props.title.toLowerCase()} right now.`);
      setLoading(false);
      return;
    }

    const only = ((data as any[]) || []).filter(
      (s) => s.submission_type === props.submissionType,
    );
    setRows(only.map((s) => ({ ...s, vote_count: 0 })));
    setLoading(false);
  }, [city.eventSlug, eventId, props.submissionType, props.title]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const items = useMemo(() => {
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

    fetchItems();
  };

  return (
    <>
      <div className="hn-header">
        <div className="hn-header-left">
          <Link href={withCity("/", city.key)} className="hn-logo">
            <span className="hn-logo-icon">🦞</span>
            <span className="hn-logo-text">Claw Con</span>
          </Link>

          <CitySelect path={props.activePath} activeCityKey={city.key} />
          <MobileNav cityKey={city.key} activePath={props.activePath} />

          {/* Keep the existing desktop nav HTML (hidden on mobile) */}
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
              href={withCity(props.activePath, city.key)}
              className="hn-nav-link active"
            >
              {props.activeNavLabel}
            </a>
            <span className="hn-nav-sep">|</span>
            <a href={withCity("/robots", city.key)} className="hn-nav-link">
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
            <h2 style={{ margin: 0 }}>
              {props.title} · {city.label}
            </h2>
            <span style={{ color: "#6b7280", fontSize: 12 }}>
              {props.subtitle}
            </span>
          </div>

          {loading ? (
            <p style={{ color: "#6b7280", marginTop: 12 }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              No {props.title.toLowerCase()} yet for {city.label}.
            </p>
          ) : (
            <table className="hn-table" style={{ marginTop: 12 }}>
              <tbody>
                {items.map((s, idx) => (
                  <tr key={s.id} className="hn-row">
                    <td className="hn-rank">{idx + 1}.</td>
                    <td className="hn-content">
                      <div className="hn-title-row">
                        <a className="hn-title" href={`/post/${s.id}`}>
                          {s.title}
                        </a>
                        <span className="hn-domain">({s.presenter_name})</span>
                      </div>
                      <div className="hn-meta">
                        <span>
                          {s.vote_count} vote{s.vote_count === 1 ? "" : "s"}
                        </span>
                        {s.links?.length ? (
                          <>
                            {" "}
                            <span>·</span>{" "}
                            <span>{getDomain(s.links[0] || "")}</span>
                          </>
                        ) : null}
                        {s.created_at ? (
                          <>
                            {" "}
                            <span>·</span> <span>{timeAgo(s.created_at)}</span>
                          </>
                        ) : null}
                      </div>
                      {s.description ? (
                        <div className="hn-meta" style={{ marginTop: 4 }}>
                          {s.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="hn-actions">
                      <button
                        className="hn-button small"
                        onClick={() => handleVote(s.id)}
                        disabled={voteLoading === s.id}
                        type="button"
                      >
                        {voteLoading === s.id ? "Voting..." : "▲ Vote"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>

        <aside className="hn-sidebar">
          <div className="hn-sidebar-box">
            <h4>➕ {props.formTitle}</h4>

            {!session ? (
              <div className="hn-signin-prompt">
                <p>Sign in on the demos page to submit.</p>
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

                  for (const f of props.fields) {
                    if (f.required && !state[f.key]?.trim()) {
                      setNotice(`${f.label} is required.`);
                      return;
                    }
                  }

                  const insert = props.buildInsert(state, city.label);

                  // Links: allow CSV in any field containing "http"
                  const linksFromFields = Object.values(state)
                    .flatMap((v) => v.split(",").map((s) => s.trim()))
                    .filter((v) => v.startsWith("http"));

                  const finalLinks = uniq([
                    ...(insert.links || []),
                    ...linksFromFields,
                  ])
                    .map((l) => sanitizeLink(l))
                    .filter((l): l is string => Boolean(l));

                  setSubmitting(true);
                  const { error } = await supabase.from("submissions").insert({
                    event_id: eventId,
                    title: insert.title,
                    description: insert.description,
                    presenter_name: insert.presenter_name,
                    links: finalLinks.length ? finalLinks : null,
                    submission_type: props.submissionType,
                    submitted_by: "human",
                  });
                  setSubmitting(false);

                  if (error) {
                    setNotice(error.message);
                    return;
                  }

                  setState((prev) => {
                    const next: Record<string, string> = { ...prev };
                    for (const k of Object.keys(next)) next[k] = "";
                    return next;
                  });

                  fetchItems();
                }}
              >
                {props.fields.map((f) => (
                  <label key={f.key}>
                    {f.label}
                    {f.kind === "textarea" ? (
                      <textarea
                        className="input"
                        placeholder={f.placeholder}
                        value={state[f.key] || ""}
                        onChange={(e) =>
                          setState((s) => ({ ...s, [f.key]: e.target.value }))
                        }
                        rows={f.rows ?? 3}
                      />
                    ) : (
                      <input
                        className="input"
                        type={f.kind === "date" ? "date" : "text"}
                        placeholder={
                          "placeholder" in f ? f.placeholder : undefined
                        }
                        value={state[f.key] || ""}
                        onChange={(e) =>
                          setState((s) => ({ ...s, [f.key]: e.target.value }))
                        }
                        required={Boolean(f.required)}
                      />
                    )}
                  </label>
                ))}

                <button
                  className="hn-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>

                <p className="hn-tip" style={{ margin: 0 }}>
                  Links must be full <code>https://</code> URLs.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
