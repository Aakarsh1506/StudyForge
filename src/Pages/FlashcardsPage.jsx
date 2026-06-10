import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeaturePage.css";

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [numCards, setNumCards] = useState("10");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState("generate");
  const [viewingDeck, setViewingDeck] = useState(null);
  const [deckCurrent, setDeckCurrent] = useState(0);
  const [deckFlipped, setDeckFlipped] = useState({});

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { credentials: "include" })
      .then(r => { if (!r.ok) navigate("/auth"); return r.json(); })
      .then(d => {
        setUserId(d.user.id);
        setDecks(JSON.parse(localStorage.getItem(`sf-flashcard-decks-${d.user.id}`) || "[]"));
      })
      .catch(() => navigate("/auth"));
  }, []);

  const saveDecks = (uid, updated) => {
    localStorage.setItem(`sf-flashcard-decks-${uid}`, JSON.stringify(updated));
    setDecks(updated);
  };

  const generate = async () => {
    if (!pdf) return setError("Please upload a PDF first.");
    setLoading(true); setError(""); setCards(null); setFlipped({}); setCurrent(0);
    try {
      const fd = new FormData();
      fd.append("pdf", pdf); fd.append("numCards", numCards);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/flashcards`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCards(data.flashcards);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const saveDeck = () => {
    const deck = { id: Date.now(), date: new Date().toLocaleDateString(), pdfName: pdf.name, cards };
    const updated = [deck, ...decks];
    saveDecks(userId, updated);
    alert("Deck saved!");
  };

  const deleteDeck = (id) => {
    const updated = decks.filter(d => d.id !== id);
    saveDecks(userId, updated);
    if (viewingDeck?.id === id) setViewingDeck(null);
  };

  const toggle = (i, flippedState, setFlippedState) =>
    setFlippedState(f => ({ ...f, [i]: !f[i] }));

  const renderCards = (cardList, cur, setCur, flippedState, setFlippedState) => (
    <>
      <div className="fp-fc-nav">
        <button className="fp-fc-arrow" onClick={() => setCur(c => Math.max(0, c-1))} disabled={cur === 0}>‹</button>
        <span>{cur+1} / {cardList.length}</span>
        <button className="fp-fc-arrow" onClick={() => setCur(c => Math.min(cardList.length-1, c+1))} disabled={cur === cardList.length-1}>›</button>
      </div>
      <div className={`fp-fc ${flippedState[cur] ? "fp-fc--flipped" : ""}`} onClick={() => toggle(cur, flippedState, setFlippedState)}>
        <div className="fp-fc__inner">
          <div className="fp-fc__front">
            <span className="fp-fc__label">FRONT</span>
            <p>{cardList[cur].front}</p>
            <span className="fp-fc__tap">Tap to flip</span>
          </div>
          <div className="fp-fc__back">
            <span className="fp-fc__label">BACK</span>
            <p>{cardList[cur].back}</p>
          </div>
        </div>
      </div>
      <div className="fp-fc-grid">
        {cardList.map((_, i) => (
          <div key={i} className={`fp-fc-thumb ${i === cur ? "fp-fc-thumb--active" : ""}`}
            onClick={() => { setCur(i); setFlippedState(f => ({...f, [i]: false})); }}>{i+1}</div>
        ))}
      </div>
    </>
  );

  if (viewingDeck) {
    return (
      <div className="fp-root">
        <nav className="db-nav">
          <span className="db-nav__logo" onClick={() => navigate("/study-planner")} style={{ cursor: "pointer" }}>StudyForge</span>
          <button className="db-nav__logout" onClick={() => { setViewingDeck(null); setDeckCurrent(0); setDeckFlipped({}); }}>‹ Back</button>
        </nav>
        <div className="db-subheader"><div className="db-subheader__greeting">Flashcard <span>Deck</span></div></div>
        <div className="fp-main">
          <div className="fp-result-meta">
            <span>📄 {viewingDeck.pdfName}</span>
            <span>📅 {viewingDeck.date}</span>
            <span>{viewingDeck.cards.length} cards</span>
          </div>
          {renderCards(viewingDeck.cards, deckCurrent, setDeckCurrent, deckFlipped, setDeckFlipped)}
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
      <div className="db-subheader"><div className="db-subheader__greeting">AI <span>Flashcards</span></div></div>

      <div className="fp-main">
        <div className="fp-tabs">
          <button className={`fp-tab ${view === "generate" ? "fp-tab--active" : ""}`} onClick={() => setView("generate")}>⚡ Generate</button>
          <button className={`fp-tab ${view === "decks" ? "fp-tab--active" : ""}`} onClick={() => setView("decks")}>🗂️ Saved Decks ({decks.length})</button>
        </div>

        {view === "generate" && (
          <div className="fp-section">
            <div
              className={`fp-upload ${pdf ? "fp-upload--filled" : ""}`}
              onClick={() => document.getElementById("fc-file-input").click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setPdf(f); }}
            >
              <input id="fc-file-input" type="file" accept="application/pdf" style={{ display: "none" }}
                onChange={(e) => e.target.files[0] && setPdf(e.target.files[0])} />
              {pdf ? <><span className="fp-upload__icon">📄</span><span className="fp-upload__name">{pdf.name}</span><span className="fp-upload__hint">Click to change</span></>
                   : <><span className="fp-upload__icon">⬆️</span><span className="fp-upload__label">Drag & drop your PDF here</span><span className="fp-upload__hint">or click to browse — PDF only</span></>}
            </div>
            <div className="fp-row">
              <div className="fp-field">
                <label>Number of Cards</label>
                <select value={numCards} onChange={e => setNumCards(e.target.value)}>
                  {["5","10","15","20"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            {error && <div className="fp-error">{error}</div>}
            <button className="fp-btn fp-btn--primary" onClick={generate} disabled={loading}>
              {loading ? <><span className="fp-spin" /> Generating…</> : "⚡ Generate Flashcards"}
            </button>
            {cards && (
              <>
                {renderCards(cards, current, setCurrent, flipped, setFlipped)}
                <button className="fp-btn fp-btn--accent" onClick={saveDeck}>💾 Save Deck</button>
              </>
            )}
          </div>
        )}

        {view === "decks" && (
          <div className="fp-section">
            {decks.length === 0
              ? <div className="fp-empty">No saved decks yet. Generate flashcards and save them here.</div>
              : decks.map(d => (
                <div key={d.id} className="fp-history-card">
                  <div className="fp-history-card__info">
                    <span className="fp-history-card__name">📄 {d.pdfName}</span>
                    <span className="fp-history-card__meta">{d.date} · {d.cards.length} cards</span>
                  </div>
                  <div className="fp-history-card__actions">
                    <button className="fp-btn fp-btn--sm" onClick={() => { setViewingDeck(d); setDeckCurrent(0); setDeckFlipped({}); }}>Study</button>
                    <button className="fp-btn fp-btn--sm fp-btn--danger" onClick={() => deleteDeck(d.id)}>Delete</button>
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