"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function PapersClient() {
  return (
    <SubmissionsPage
      title="Papers"
      subtitle="Whitepapers, research, academic notes, or anything else."
      activePath="/papers"
      activeNavLabel="papers"
      submissionType="paper"
      formTitle="Submit a paper"
      fields={[
        { key: "title", label: "Title", required: true, kind: "text" },
        {
          key: "authors",
          label: "Authors",
          required: true,
          kind: "text",
          placeholder: "Name1, Name2",
        },
        {
          key: "url",
          label: "URL (optional)",
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "abstract",
          label: "Abstract / note (optional)",
          kind: "textarea",
          rows: 4,
          placeholder: "1–3 sentences",
        },
        {
          key: "type",
          label: "Type (whitepaper/research/academic/other)",
          kind: "text",
          placeholder: "whitepaper",
        },
      ]}
      buildInsert={(s) => {
        const type = (s.type || "").trim();
        const prefix = type ? `[${type}] ` : "";
        return {
          title: `${prefix}${(s.title || "").trim()}`.trim(),
          presenter_name: (s.authors || "").trim() || "Unknown",
          description: (s.abstract || "").trim(),
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
