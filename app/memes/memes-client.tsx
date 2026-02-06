"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function MemesClient() {
  return (
    <SubmissionsPage
      title="Memes"
      subtitle="Post memes for Claw Con."
      activePath="/memes"
      activeNavLabel="memes"
      submissionType="meme"
      formTitle="Submit a meme"
      fields={[
        {
          key: "title",
          label: "Title",
          required: true,
          kind: "text",
          placeholder: "When the agent...",
        },
        {
          key: "url",
          label: "Meme URL",
          required: true,
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "credit",
          label: "Credit (optional)",
          kind: "text",
          placeholder: "@you",
        },
      ]}
      buildInsert={(s) => {
        return {
          title: (s.title || "").trim(),
          presenter_name: (s.credit || "").trim() || "Anonymous",
          description: "",
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
