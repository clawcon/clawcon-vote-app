"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function AwardsClient() {
  return (
    <SubmissionsPage
      title="Awards"
      subtitle="Prizes, grants, challenges, and bounties."
      activePath="/awards"
      activeNavLabel="awards"
      submissionType="award"
      formTitle="Submit an award"
      fields={[
        {
          key: "title",
          label: "Award title",
          required: true,
          kind: "text",
          placeholder: "Best Tooling",
        },
        {
          key: "sponsor",
          label: "Sponsor name",
          required: true,
          kind: "text",
          placeholder: "Acme Co",
        },
        {
          key: "kind",
          label: "Kind (prize/grant/challenge/bounty)",
          kind: "text",
          placeholder: "prize",
        },
        {
          key: "amount",
          label: "Amount (optional)",
          kind: "text",
          placeholder: "$5000",
        },
        {
          key: "url",
          label: "URL (optional)",
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "description",
          label: "Description",
          required: true,
          kind: "textarea",
          rows: 4,
          placeholder: "What is it? How do you win?",
        },
      ]}
      buildInsert={(s) => {
        const kind = (s.kind || "").trim();
        const prefix = kind ? `[${kind}] ` : "";
        const amount = (s.amount || "").trim();
        const descExtra = amount ? `Amount: ${amount}` : "";
        const desc = [descExtra, (s.description || "").trim()]
          .filter(Boolean)
          .join(" · ");

        return {
          title: `${prefix}${(s.title || "").trim()}`.trim(),
          presenter_name: (s.sponsor || "").trim() || "Sponsor",
          description: desc,
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
