import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AIStudyPlanner.css";

export default function AIStudyPlanner() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I'm your AI Study Assistant 👋 Ask me anything academic — concepts, exam prep, study tips, or help understanding your notes. Study-focused only!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(15);
  const [limitHit, setLimitHit] = useState(false);
  const bottomRef = useRef(null);

  const handleSend = async () => {
    if (!chatInput.trim() || loading || limitHit) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Required to send the session cookie
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimitHit(true);
        setMessages(prev => [...prev, { role: "ai", text: data.error }]);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setRemaining(data.remaining);
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="asp-root">
      <nav className="db-nav">
        <span className="db-nav__logo" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
          StudyForge
        </span>
        <button className="db-nav__logout" onClick={() => navigate("/dashboard")}>
          &lt; Back to Dashboard
        </button>
      </nav>

      <div className="db-subheader">
        <div className="db-subheader__greeting">
          AI <span>Study Planner</span>
        </div>
      </div>

      <div className="asp-main">
        <div className="asp-tools">

          <div className="asp-tool-card">
            <div className="asp-tool-card__icon asp-tool-card__icon--quiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="asp-tool-card__body">
              <h3 className="asp-tool-card__title">AI Quiz Generator</h3>
              <p className="asp-tool-card__desc">Upload your notes and instantly generate a custom quiz.</p>
            </div>
            <div className="asp-tool-card__actions">
              <button className="asp-btn asp-btn--primary" onClick={() => navigate("/quiz")}>
                Generate
              </button>
            </div>
          </div>

          <div className="asp-tool-card">
            <div className="asp-tool-card__icon asp-tool-card__icon--flash">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="asp-tool-card__body">
              <h3 className="asp-tool-card__title">AI Flashcard Generator</h3>
              <p className="asp-tool-card__desc">Turn study material into bite-sized flashcards.</p>
            </div>
            <div className="asp-tool-card__actions">
              <button className="asp-btn asp-btn--primary" onClick={() => navigate("/flashcards")}>
                Create
              </button>
            </div>
          </div>

          <div className="asp-tool-card">
            <div className="asp-tool-card__icon asp-tool-card__icon--plan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <polyline points="9 16 11 18 15 14" />
              </svg>
            </div>
            <div className="asp-tool-card__body">
              <h3 className="asp-tool-card__title">AI Study Planner</h3>
              <p className="asp-tool-card__desc">Get a personalized, AI-generated study schedule.</p>
            </div>
            <div className="asp-tool-card__actions">
              <button className="asp-btn asp-btn--primary" onClick={() => navigate("/planner")}>
                Build
              </button>
            </div>
          </div>

        </div>

        <div className="asp-chat">
          <div className="asp-chat__header">
            <div className="asp-chat__header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="asp-chat__title">AI Assistant</div>
              <div className="asp-chat__subtitle">{remaining} messages left today</div>
            </div>
          </div>
          <div className="asp-chat__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`asp-msg asp-msg--${msg.role}`}>
                {msg.role === "ai" && <div className="asp-msg__avatar">SF</div>}
                <div className="asp-msg__bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="asp-msg asp-msg--ai">
                <div className="asp-msg__avatar">SF</div>
                <div className="asp-msg__bubble asp-msg__bubble--typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="asp-chat__input-row">
            <input
              className="asp-chat__input"
              type="text"
              placeholder={limitHit ? "Daily limit reached. Come back tomorrow!" : "Ask anything academic…"}
              value={chatInput}
              disabled={limitHit}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="asp-chat__send" onClick={handleSend} disabled={loading || limitHit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <footer className="db-footer">
        <span className="db-footer__logo">StudyForge</span>
        <span className="db-footer__tagline">Your AI-powered study companion</span>
      </footer>
    </div>
  );
}