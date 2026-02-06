"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function SkillsClient() {
  return (
    <SubmissionsPage
      title="Skills"
      subtitle="Share useful skills/tools for Claw Con builders."
      activePath="/skills"
      activeNavLabel="skills"
      submissionType="skill"
      formTitle="Submit a skill"
      fields={[
        {
          key: "name",
          label: "Skill name",
          required: true,
          kind: "text",
          placeholder: "supabase-sync",
        },
        {
          key: "description",
          label: "What does it do?",
          required: true,
          kind: "textarea",
          rows: 4,
          placeholder: "1–3 sentences",
        },
        {
          key: "url",
          label: "URL (optional)",
          kind: "text",
          placeholder: "https://github.com/...",
        },
        {
          key: "author",
          label: "Author (optional)",
          kind: "text",
          placeholder: "Your name",
        },
      ]}
      buildInsert={(s) => {
        return {
          title: (s.name || "").trim(),
          presenter_name: (s.author || "").trim() || "Anonymous",
          description: (s.description || "").trim(),
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
