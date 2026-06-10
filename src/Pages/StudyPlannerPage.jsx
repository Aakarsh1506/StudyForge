import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeaturePage.css";

export default function StudyPlannerPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ subjects: "", examDate: "", hoursPerDay: "3", goals: "" });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [view, setView] = useState("generate");
  const [viewingPlan, setViewingPlan] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { credentials: "include" })
      .then(r => { if (!r.ok) navigate("/auth"); return r.json(); })
      .then(d => {
        setUserId(d.user.id);
        setPlans(JSON.parse(localStorage.getItem(`sf-study-plans-${d.user.id}`) || "[]"));
      })
      .catch(() => navigate("/auth"));
  }, []);

  const savePlans = (uid, updated) => {
    localStorage.setItem(`sf-study-plans-${uid}`, JSON.stringify(updated));
    setPlans(updated);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.subjects || !form.examDate) return setError("Subjects and exam date are required.");
    setLoading(true); setError(""); setPlan(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/study-plan`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const savePlan = () => {
    const saved = { id: Date.now(), date: new Date().toLocaleDateString(), subjects: form.subjects, examDate: form.examDate, plan };
    const updated = [saved, ...plans];
    savePlans(userId, updated);
    alert("Plan saved!");
  };

  const deletePlan = (id) => {
    const updated = plans.filter(p => p.id !== id);
    savePlans(userId, updated);
    if (viewingPlan?.id === id) setViewingPlan(null);
  };

  const renderPlan = (p) => (
    <div className="fp-plan">
      <div className="fp-plan__summary">{p.summary}</div>
      <div className="fp-plan__days">
        {p.plan.map(day => (
          <div key={day.day} className="fp-plan__day">
            <div className="fp-plan__day-header">
              <span className="fp-plan__day-num">Day {day.day}</span>
              <span className="fp-plan__day-date">{day.date}</span>
              <span className="fp-plan__day-goal">{day.dailyGoal}</span>
            </div>
            <div className="fp-plan__sessions">
              {day.sessions.map((s, i) => (
                <div key={i} className="fp-plan__session">
                  <span className="fp-plan__subject">{s.subject}</span>
                  <span className="fp-plan__topic">{s.topic}</span>
                  <span className="fp-plan__dur">{s.duration}</span>
                  <span className="fp-plan__act">{s.activity}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {p.tips?.length > 0 && (
        <div className="fp-plan__tips">
          <strong>💡 Tips</strong>
          <ul>{p.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
    </div>
  );

  if (viewingPlan) {
    return (
      <div className="fp-root">
        <nav className="db-nav">
          <span className="db-nav__logo" onClick={() => navigate("/study-planner")} style={{ cursor: "pointer" }}>StudyForge</span>
          <button className="db-nav__logout" onClick={() => setViewingPlan(null)}>‹ Back</button>
        </nav>
        <div className="db-subheader"><div className="db-subheader__greeting">Study <span>Plan</span></div></div>
        <div className="fp-main">
          <div className="fp-result-meta">
            <span>📚 {viewingPlan.subjects}</span>
            <span>📅 Exam: {viewingPlan.examDate}</span>
            <span>🗓️ Saved: {viewingPlan.date}</span>
          </div>
          {renderPlan(viewingPlan.plan)}
        </div>
        <footer className="db-footer"><span className="db-footer__logo">StudyForge</span><span className="db-footer__tagline">Your AI-powered study companion</span></footer>
      </div>
    );
  }

  return (
    <div className="fp-root">
      <nav className="db-nav">
        <span className="db-nav__logo" onClick={() => navigate("/study-planner")} style={{ cursor: "pointer" }}>StudyForge</span>
        <button className="db-nav__logout" onClick={() => navigate("/study-planner")}>‹ Back</button>
      </nav>
      <div className="db-subheader"><div className="db-subheader__greeting">AI <span>Study Planner</span></div></div>

      <div className="fp-main">
        <div className="fp-tabs">
          <button className={`fp-tab ${view === "generate" ? "fp-tab--active" : ""}`} onClick={() => setView("generate")}>📅 Generate</button>
          <button className={`fp-tab ${view === "saved" ? "fp-tab--active" : ""}`} onClick={() => setView("saved")}>💾 Saved Plans ({plans.length})</button>
        </div>

        {view === "generate" && (
          <div className="fp-section">
            <div className="fp-form">
              <div className="fp-field fp-field--full">
                <label>Subjects / Topics *</label>
                <input type="text" placeholder="e.g. Data Structures, DBMS, OS"
                  value={form.subjects} onChange={e => set("subjects", e.target.value)} />
              </div>
              <div className="fp-field">
                <label>Exam Date *</label>
                <input type="date" value={form.examDate} onChange={e => set("examDate", e.target.value)} />
              </div>
              <div className="fp-field">
                <label>Hours Per Day</label>
                <select value={form.hoursPerDay} onChange={e => set("hoursPerDay", e.target.value)}>
                  {["1","2","3","4","5","6","8"].map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="fp-field fp-field--full">
                <label>Goals (optional)</label>
                <input type="text" placeholder="e.g. Score above 85%, clear backlog"
                  value={form.goals} onChange={e => set("goals", e.target.value)} />
              </div>
            </div>
            {error && <div className="fp-error">{error}</div>}
            <button className="fp-btn fp-btn--primary" onClick={generate} disabled={loading}>
              {loading ? <><span className="fp-spin" /> Building Plan…</> : "📅 Generate Study Plan"}
            </button>
            {plan && (
              <>
                {renderPlan(plan)}
                <button className="fp-btn fp-btn--accent" onClick={savePlan}>💾 Save Plan</button>
              </>
            )}
          </div>
        )}

        {view === "saved" && (
          <div className="fp-section">
            {plans.length === 0
              ? <div className="fp-empty">No saved plans yet. Generate a plan and save it here.</div>
              : plans.map(p => (
                <div key={p.id} className="fp-history-card">
                  <div className="fp-history-card__info">
                    <span className="fp-history-card__name">📚 {p.subjects}</span>
                    <span className="fp-history-card__meta">{p.date} · Exam: {p.examDate} · {p.plan.totalDays} days</span>
                  </div>
                  <div className="fp-history-card__actions">
                    <button className="fp-btn fp-btn--sm" onClick={() => setViewingPlan(p)}>View</button>
                    <button className="fp-btn fp-btn--sm fp-btn--danger" onClick={() => deletePlan(p.id)}>Delete</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
      <footer className="db-footer"><span className="db-footer__logo">StudyForge</span><span className="db-footer__tagline">Your AI-powered study companion</span></footer>
    </div>
  );
}