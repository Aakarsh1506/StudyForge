import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import TimetableSection from "./TimetableSection.jsx";

const today = new Date();
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("there");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [assignments, setAssignments] = useState(() =>
    JSON.parse(localStorage.getItem("sf-assignments") || "[]").filter(
      a => !a.completed && new Date(a.dueDate) >= new Date()
    )
  );

  // ── FETCH REAL USER + PROTECT ROUTE ──
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => {
        if (!res.ok) navigate("/auth");
        return res.json();
      })
      .then(data => setUsername(data.user.name))
      .catch(() => navigate("/auth"));
  }, []);

  useEffect(() => {
    setAssignments(
      JSON.parse(localStorage.getItem("sf-assignments") || "[]").filter(
        a => !a.completed && new Date(a.dueDate) >= new Date()
      )
    );
  }, []);

  // ── LOGOUT ──
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="db-root">

      {/* ── NAVBAR ── */}
      <nav className="db-nav">
        <span className="db-nav__logo" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>StudyForge</span>
        <div className="db-nav__links">
          {["Notes", "Assignment Tracker", "AI Study Planner"].map((item) => (
            <button
              key={item}
              className={`db-nav__link ${activeNav === item ? "active" : ""}`}
              onClick={() => {
                if (item === "Notes") navigate("/notes");
                else if (item === "Assignment Tracker") navigate("/assignments");
                else if (item === "AI Study Planner") navigate("/study-planner");
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="db-nav__logout" onClick={handleLogout}>Logout</button>
      </nav>

      {/* ── SUBHEADER ── */}
      <div className="db-subheader">
        <div className="db-subheader__greeting">
          Hello, <span>{username}</span>
        </div>
        <div className="db-subheader__actions">
          <button className="db-action-btn" onClick={() => navigate('/notes')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Notes
          </button>
          <button className="db-action-btn" onClick={() => navigate('/assignments')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Assignments
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <main className="db-main">

        {/* ── LEFT: TIMETABLE ── */}
        <TimetableSection />

        {/* ── MIDDLE: ASSIGNMENTS ── */}
        <section className="db-panel db-panel--mid">
          <div className="db-panel__header">
            <h2 className="db-panel__title">Assignments</h2>
            {assignments.length > 0 && (
              <span className="db-panel__count">{assignments.length} pending</span>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="db-empty" onClick={() => navigate('/assignments')} style={{ cursor: 'pointer' }}>
              <div className="db-empty__icon">+</div>
              <p className="db-empty__text">Upload to see your assignments</p>
            </div>
          ) : (
            <div className="db-assignments">
              {assignments.map((a, i) => (
                <div
                  key={i}
                  className="db-assignment-card"
                  onClick={() => navigate("/assignments", { state: { assignmentId: a.id } })}
                  style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer' }}
                >
                  <div className="db-assignment-card__left">
                    <div className="db-assignment-card__dot" />
                    <div className="db-assignment-card__name">{a.name}</div>
                  </div>
                  <div className="db-assignment-card__due">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {new Date(a.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── RIGHT: QUICK ACCESS ── */}
        <section className="db-panel db-panel--right">
          <div className="db-panel__header">
            <h2 className="db-panel__title">Quick Access</h2>
          </div>
          <div className="db-quick">

            <div className="db-quick-card" onClick={() => navigate('/notes')}>
              <div className="db-quick-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <span className="db-quick-card__label">Notes</span>
            </div>

            <div className="db-quick-card" onClick={() => navigate('/assignments')}>
              <div className="db-quick-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="db-quick-card__label">Add & Upload Assignments</span>
            </div>

            <div className="db-quick-card" onClick={() => navigate('/study-planner')}>
              <div className="db-quick-card__icon db-quick-card__icon--ai">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                  <circle cx="9" cy="14" r="1" fill="currentColor" />
                  <circle cx="15" cy="14" r="1" fill="currentColor" />
                </svg>
              </div>
              <span className="db-quick-card__label">AI Study Planner</span>
            </div>

          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="db-footer">
        <span className="db-footer__logo">StudyForge</span>
        <span className="db-footer__tagline">Your AI-powered study companion</span>
      </footer>

    </div>
  );
}