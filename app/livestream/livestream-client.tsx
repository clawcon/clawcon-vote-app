"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function LivestreamClient() {
  return (
    <SubmissionsPage
      title="Livestream"
      subtitle="Streams, recordings, and live links."
      activePath="/livestream"
      activeNavLabel="livestream"
      submissionType="livestream"
      formTitle="Submit a livestream link"
      fields={[
        {
          key: "title",
          label: "Title",
          required: true,
          kind: "text",
          placeholder: "Claw Con SF livestream",
        },
        {
          key: "host",
          label: "Host / channel (optional)",
          kind: "text",
          placeholder: "StreamYard / YouTube",
        },
        {
          key: "url",
          label: "URL",
          required: true,
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "notes",
          label: "Notes (optional)",
          kind: "text",
          placeholder: "Starts at 6pm",
        },
      ]}
      buildInsert={(s) => {
        const notes = (s.notes || "").trim();
        return {
          title: (s.title || "").trim(),
          presenter_name: (s.host || "").trim() || "Livestream",
          description: notes,
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
