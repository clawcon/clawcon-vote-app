"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function SponsorsClient() {
  return (
    <SubmissionsPage
      title="Sponsors"
      subtitle="Thank you for supporting Claw Con."
      activePath="/sponsors"
      activeNavLabel="sponsors"
      submissionType="sponsor"
      formTitle="Submit a sponsor"
      fields={[
        { key: "name", label: "Sponsor name", required: true, kind: "text" },
        {
          key: "kind",
          label: "Type (in-kind/credits/awards/prizes/grants/challenges)",
          kind: "text",
          placeholder: "in-kind",
        },
        {
          key: "contribution",
          label: "Contribution (optional)",
          kind: "text",
          placeholder: "What are you sponsoring?",
        },
        {
          key: "url",
          label: "URL (optional)",
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "notes",
          label: "Notes (optional)",
          kind: "text",
          placeholder: "Contact / details / constraints",
        },
        {
          key: "logo",
          label: "Logo URL (optional)",
          kind: "text",
          placeholder: "https://.../logo.svg",
        },
      ]}
      buildInsert={(s) => {
        const kind = (s.kind || "").trim();
        const prefix = kind ? `[${kind}] ` : "";
        const contribution = (s.contribution || "").trim();
        const notes = (s.notes || "").trim();
        const desc = [
          contribution ? `Contribution: ${contribution}` : "",
          notes ? `Notes: ${notes}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        const links = [s.url, s.logo]
          .map((x) => (x || "").trim())
          .filter(Boolean);

        return {
          title: `${prefix}${(s.name || "").trim()}`.trim(),
          presenter_name: contribution || "Sponsor",
          description: desc,
          links: links.length ? links : null,
        };
      }}
    />
  );
}
