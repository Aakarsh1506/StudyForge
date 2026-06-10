import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeaturePage.css";

function PdfUploadZone({ onFile, currentFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useState(null);
  const ref = { current: null };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") onFile(file);
  };

  return (
    <div
      className={`fp-upload ${dragging ? "fp-upload--drag" : ""} ${currentFile ? "fp-upload--filled" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("quiz-file-input").click()}
    >
      <input id="quiz-file-input" type="file" accept="application/pdf"
        style={{ display: "none" }} onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      {currentFile ? (
        <><span className="fp-upload__icon">📄</span>
          <span className="fp-upload__name">{currentFile.name}</span>
          <span className="fp-upload__hint">Click to change</span></>
      ) : (
        <><span className="fp-upload__icon">⬆️</span>
          <span className="fp-upload__label">Drag & drop your PDF here</span>
          <span className="fp-upload__hint">or click to browse — PDF only, max 10 MB</span></>
      )}
    </div>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [numQ, setNumQ] = useState("5");
  const [diff, setDiff] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("generate"); // "generate" | "history"
  const [viewingResult, setViewingResult] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { credentials: "include" })
      .then(r => { if (!r.ok) navigate("/auth"); return r.json(); })
      .then(d => {
        setUserId(d.user.id);
        setHistory(JSON.parse(localStorage.getItem(`sf-quiz-history-${d.user.id}`) || "[]"));
      })
      .catch(() => navigate("/auth"));
  }, []);

  const saveHistory = (userId, newHistory) => {
    localStorage.setItem(`sf-quiz-history-${userId}`, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const generate = async () => {
    if (!pdf) return setError("Please upload a PDF first.");
    setLoading(true); setError(""); setQuiz(null); setAnswers({}); setSubmitted(false);
    try {
      const fd = new FormData();
      fd.append("pdf", pdf); fd.append("numQuestions", numQ); fd.append("difficulty", diff);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/quiz`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuiz(data.questions);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submitQuiz = () => {
    setSubmitted(true);
    const score = quiz.filter((q, i) => answers[i] === q.answer).length;
    const result = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      pdfName: pdf.name,
      difficulty: diff,
      score,
      total: quiz.length,
      questions: quiz,
      answers,
    };
    const updated = [result, ...history];
    saveHistory(userId, updated);
  };

  const deleteResult = (id) => {
    const updated = history.filter(h => h.id !== id);
    saveHistory(userId, updated);
    if (viewingResult?.id === id) setViewingResult(null);
  };

  const score = quiz ? quiz.filter((q, i) => answers[i] === q.answer).length : 0;

  if (viewingResult) {
    return (
      <div className="fp-root">
        <nav className="db-nav">
          <span className="db-nav__logo" onClick={() => navigate("/study-planner")} style={{ cursor: "pointer" }}>StudyForge</span>
          <button className="db-nav__logout" onClick={() => setViewingResult(null)}>‹ Back</button>
        </nav>
        <div className="db-subheader"><div className="db-subheader__greeting">Quiz <span>Result</span></div></div>
        <div className="fp-main">
          <div className="fp-result-meta">
            <span>📄 {viewingResult.pdfName}</span>
            <span>📅 {viewingResult.date}</span>
            <span>🎯 {viewingResult.difficulty}</span>
            <span className="fp-score">Score: {viewingResult.score}/{viewingResult.total}</span>
          </div>
          <div className="fp-quiz">
            {viewingResult.questions.map((q, i) => (
              <div key={i} className={`fp-qcard ${viewingResult.answers[i] === q.answer ? "fp-qcard--ok" : "fp-qcard--bad"}`}>
                <p className="fp-qcard__q"><strong>Q{i+1}.</strong> {q.question}</p>
                <div className="fp-qcard__opts">
                  {q.options.map(opt => (
                    <div key={opt} className={`fp-opt ${opt.startsWith(q.answer) ? "fp-opt--correct" : ""} ${viewingResult.answers[i] === opt[0] && viewingResult.answers[i] !== q.answer ? "fp-opt--wrong" : ""}`}>
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="fp-qcard__exp">💡 {q.explanation}</p>
              </div>
            ))}
          </div>
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
      <div className="db-subheader"><div className="db-subheader__greeting">AI <span>Quiz Generator</span></div></div>

      <div className="fp-main">
        <div className="fp-tabs">
          <button className={`fp-tab ${view === "generate" ? "fp-tab--active" : ""}`} onClick={() => setView("generate")}>⚡ Generate</button>
          <button className={`fp-tab ${view === "history" ? "fp-tab--active" : ""}`} onClick={() => setView("history")}>📋 History ({history.length})</button>
        </div>

        {view === "generate" && (
          <div className="fp-section">
            <PdfUploadZone onFile={setPdf} currentFile={pdf} />
            <div className="fp-row">
              <div className="fp-field">
                <label>Questions</label>
                <select value={numQ} onChange={e => setNumQ(e.target.value)}>
                  {["3","5","8","10","15"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="fp-field">
                <label>Difficulty</label>
                <select value={diff} onChange={e => setDiff(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            {error && <div className="fp-error">{error}</div>}
            <button className="fp-btn fp-btn--primary" onClick={generate} disabled={loading}>
              {loading ? <><span className="fp-spin" /> Generating…</> : "⚡ Generate Quiz"}
            </button>

            {quiz && (
              <div className="fp-quiz">
                {quiz.map((q, i) => (
                  <div key={i} className={`fp-qcard ${submitted ? (answers[i] === q.answer ? "fp-qcard--ok" : "fp-qcard--bad") : ""}`}>
                    <p className="fp-qcard__q"><strong>Q{i+1}.</strong> {q.question}</p>
                    <div className="fp-qcard__opts">
                      {q.options.map(opt => (
                        <label key={opt} className={`fp-opt ${submitted && opt.startsWith(q.answer) ? "fp-opt--correct" : ""} ${submitted && answers[i] === opt[0] && answers[i] !== q.answer ? "fp-opt--wrong" : ""}`}>
                          <input type="radio" name={`q${i}`} value={opt[0]} disabled={submitted}
                            checked={answers[i] === opt[0]} onChange={() => setAnswers({ ...answers, [i]: opt[0] })} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {submitted && <p className="fp-qcard__exp">💡 {q.explanation}</p>}
                  </div>
                ))}
                {!submitted
                  ? <button className="fp-btn fp-btn--accent" onClick={submitQuiz}>Submit & Save Quiz</button>
                  : <div className="fp-score">Score: {score}/{quiz.length} {score === quiz.length ? "🎉 Perfect!" : score >= quiz.length * 0.7 ? "✅ Great!" : "📚 Keep studying!"}<br/><small>Result saved to history</small></div>
                }
              </div>
            )}
          </div>
        )}

        {view === "history" && (
          <div className="fp-section">
            {history.length === 0
              ? <div className="fp-empty">No quiz results yet. Generate and submit a quiz to save it here.</div>
              : history.map(h => (
                <div key={h.id} className="fp-history-card">
                  <div className="fp-history-card__info">
                    <span className="fp-history-card__name">📄 {h.pdfName}</span>
                    <span className="fp-history-card__meta">{h.date} · {h.difficulty} · {h.total} questions</span>
                  </div>
                  <div className="fp-history-card__score">{h.score}/{h.total}</div>
                  <div className="fp-history-card__actions">
                    <button className="fp-btn fp-btn--sm" onClick={() => setViewingResult(h)}>View</button>
                    <button className="fp-btn fp-btn--sm fp-btn--danger" onClick={() => deleteResult(h.id)}>Delete</button>
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