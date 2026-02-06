"use client";

import { useEffect, useState } from "react";
import { withCity } from "../lib/cities";

const CITIES = [
  { key: "san-francisco", label: "San Francisco" },
  { key: "denver", label: "Denver" },
  { key: "tokyo", label: "Tokyo" },
  { key: "kona", label: "Kona" },
] as const;

export default function CitySidebar(props: {
  path: string;
  activeCityKey: string;
}) {
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("clawcon.citySidebar.hidden") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "clawcon.citySidebar.hidden",
        hidden ? "1" : "0",
      );
    } catch {}
  }, [hidden]);

  return (
    <>
      <button
        className="hn-city-toggle"
        type="button"
        aria-label={hidden ? "Show cities" : "Hide cities"}
        onClick={() => setHidden((v) => !v)}
      >
        {hidden ? "Cities" : "Hide"}
      </button>

      <aside
        className={hidden ? "hn-city-sidebar hidden" : "hn-city-sidebar"}
        aria-label="City selector"
      >
        <div className="hn-city-sidebar-label">Cities</div>
        {CITIES.map((c) => (
          <a
            key={c.key}
            className={props.activeCityKey === c.key ? "active" : ""}
            href={withCity(props.path, c.key)}
          >
            {c.label}
          </a>
        ))}
      </aside>
    </>
  );
}
