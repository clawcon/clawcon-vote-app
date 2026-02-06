"use client";

import SubmissionsPage from "../_shared/submissions-page";

export default function ChatsClient() {
  return (
    <SubmissionsPage
      title="Chats"
      subtitle="Join a city chat or start one."
      activePath="/chats"
      activeNavLabel="join the chat"
      submissionType="chat"
      formTitle="Submit a chat link"
      fields={[
        {
          key: "name",
          label: "Chat name",
          required: true,
          kind: "text",
          placeholder: "Claw Con SF Telegram",
        },
        {
          key: "platform",
          label: "Platform (telegram/discord/whatsapp/signal/etc)",
          kind: "text",
          placeholder: "telegram",
        },
        {
          key: "url",
          label: "Invite URL",
          required: true,
          kind: "text",
          placeholder: "https://...",
        },
        {
          key: "notes",
          label: "Notes (optional)",
          kind: "text",
          placeholder: "Rules / admin contact",
        },
      ]}
      buildInsert={(s) => {
        const platform = (s.platform || "").trim();
        const prefix = platform ? `[${platform}] ` : "";
        const notes = (s.notes || "").trim();
        return {
          title: `${prefix}${(s.name || "").trim()}`.trim(),
          presenter_name: "Chat",
          description: notes,
          links: s.url?.trim() ? [s.url.trim()] : null,
        };
      }}
    />
  );
}
