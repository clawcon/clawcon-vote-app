"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function JobsClient() {
  return (
    <SubmissionsPage
      title="Jobs"
      subtitle="Open roles from companies around Claw Con."
      activePath="/jobs"
      activeNavLabel="jobs"
      submissionType="job"
      formTitle="Submit a job"
      fields={[
        {
          key: "company",
          label: "Company",
          required: true,
          kind: "text",
          placeholder: "Acme Co",
        },
        {
          key: "title",
          label: "Role title",
          required: true,
          kind: "text",
          placeholder: "Founding Engineer",
        },
        {
          key: "location",
          label: "Location (optional)",
          kind: "text",
          placeholder: "SF / Remote",
        },
        {
          key: "comp",
          label: "Compensation (optional)",
          kind: "text",
          placeholder: "$200k + equity",
        },
        {
          key: "url",
          label: "Job URL",
          required: true,
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "notes",
          label: "Notes (optional)",
          kind: "text",
          placeholder: "Visa / stack / interview loop",
        },
      ]}
      buildInsert={(s) => {
        const location = (s.location || "").trim();
        const comp = (s.comp || "").trim();
        const notes = (s.notes || "").trim();
        const desc = [
          location ? `Location: ${location}` : "",
          comp ? `Comp: ${comp}` : "",
          notes ? `Notes: ${notes}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        return {
          title: (s.title || "").trim(),
          presenter_name: (s.company || "").trim(),
          description: desc,
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
