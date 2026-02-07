export default function BotPage() {
  return (
    <div className="oc-stack">
      <h2 className="oc-h2">ClawdCon Bot</h2>
      <p className="oc-muted">
        Coming next: a chatbot that can answer questions about submissions,
        recommend talks, and help with scheduling.
      </p>

      <div className="oc-card">
        <div className="oc-card-title">Chat</div>
        <div className="oc-chat">
          <div className="oc-chat-msg bot">
            <div className="oc-chat-bubble">
              Ask me things like “what are the top demos in SF?”
            </div>
          </div>
          <div className="oc-chat-compose">
            <input
              className="oc-input"
              placeholder="Type a message…"
              disabled
            />
            <button className="oc-button" disabled>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
