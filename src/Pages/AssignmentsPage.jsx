import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AssignmentsPage.css";

const getStorageKey = (userId) => `sf-assignments-${userId}`;
const getAssignments = (userId) => JSON.parse(localStorage.getItem(getStorageKey(userId)) || "[]");
const saveAssignments = (userId, data) => localStorage.setItem(getStorageKey(userId), JSON.stringify(data));

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", dueDate: "", resources: [] });
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [renameIndex, setRenameIndex] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [detailIndex, setDetailIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [celebrating, setCelebrating] = useState(false);
  const menuRef = useRef(null);
  const resourceInputRef = useRef(null);

  // ── FETCH USER + LOAD THEIR DATA ──
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { credentials: "include" })
      .then(res => { if (!res.ok) navigate("/auth"); return res.json(); })
      .then(data => {
        const id = data.user.id;
        setUserId(id);
        setAssignments(getAssignments(id));
      })
      .catch(() => navigate("/auth"));
  }, []);

  // ── SAVE ON CHANGE (only after user is loaded) ──
  useEffect(() => {
    if (userId) saveAssignments(userId, assignments);
  }, [assignments, userId]);

  useEffect(() => {
    if (location.state?.assignmentId) {
      const index = assignments.findIndex(a => a.id === location.state.assignmentId);
      if (index !== -1) setDetailIndex(index);
    }
  }, [assignments, location.state]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuIndex(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render until user is loaded
  if (!userId) return null;

  const now = new Date();
  const activeAssignments = assignments.filter(a => !a.completed && new Date(a.dueDate) >= now);
  const completedAssignments = assignments.filter(a => a.completed);
  const pastDueAssignments = assignments.filter(a => !a.completed && new Date(a.dueDate) < now);

  const handleResourceUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({ name: file.name, type: file.type, data: ev.target.result, uploadedAt: new Date().toISOString() });
      reader.readAsDataURL(file);
    }))).then(newFiles => setForm(prev => ({ ...prev, resources: [...prev.resources, ...newFiles] })));
    e.target.value = "";
  };

  const addAssignment = () => {
    if (!form.name.trim() || !form.dueDate) return;
    setAssignments([...assignments, {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      dueDate: form.dueDate,
      resources: form.resources,
      completed: false,
      createdAt: new Date().toISOString()
    }]);
    setForm({ name: "", dueDate: "", resources: [] });
    setShowModal(false);
  };

  const deleteAssignment = (index) => { setAssignments(assignments.filter((_, i) => i !== index)); setOpenMenuIndex(null); };
  const startRename = (index) => { setRenameIndex(index); setRenameName(assignments[index].name); setOpenMenuIndex(null); };
  const confirmRename = () => {
    if (!renameName.trim()) return;
    const updated = [...assignments];
    updated[renameIndex] = { ...updated[renameIndex], name: renameName.trim() };
    setAssignments(updated); setRenameIndex(null);
  };

  const markCompleted = (index) => {
    setCelebrating(true);
    setTimeout(() => {
      const updated = [...assignments];
      updated[index] = { ...updated[index], completed: true, completedAt: new Date().toISOString() };
      setAssignments(updated);
      setCelebrating(false);
      setDetailIndex(null);
    }, 2200);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const AssignmentIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );

  const TabNav = () => (
    <div className="asgn-tabs">
      {[
        { key: "active", label: "Active" },
        { key: "completed", label: "Completed" },
        { key: "pastdue", label: "Past Due" },
      ].map(tab => (
        <button key={tab.key}
          className={`asgn-tab ${activeTab === tab.key ? "asgn-tab--active" : ""} ${tab.key === "pastdue" ? "asgn-tab--pastdue" : ""}`}
          onClick={() => setActiveTab(tab.key)}>
          {tab.label}
          {tab.key === "active" && activeAssignments.length > 0 && <span className="asgn-tab__badge">{activeAssignments.length}</span>}
          {tab.key === "pastdue" && pastDueAssignments.length > 0 && <span className="asgn-tab__badge asgn-tab__badge--red">{pastDueAssignments.length}</span>}
        </button>
      ))}
    </div>
  );

  const CardList = ({ list, isPastDue, isCompleted }) => (
    list.length === 0 ? (
      <div className="asgn-empty" style={{ cursor: "default", opacity: 0.5 }}>
        <div className="asgn-empty__icon" style={{ fontSize: "1.5rem" }}>
          {isCompleted ? "✓" : isPastDue ? "!" : "+"}
        </div>
        <p className="asgn-empty__title">
          {isCompleted ? "No completed assignments" : isPastDue ? "No past due assignments" : "No active assignments"}
        </p>
        <p className="asgn-empty__sub">
          {isCompleted ? "Mark assignments as done to see them here" : isPastDue ? "You're all caught up!" : "Add a new assignment to get started"}
        </p>
      </div>
    ) : (
      <div className="asgn-grid">
        {list.map((a, i) => {
          const globalIndex = assignments.indexOf(a);
          return (
            <div key={i} className={`asgn-card ${isPastDue ? "asgn-card--pastdue" : ""} ${isCompleted ? "asgn-card--completed" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => setDetailIndex(globalIndex)}>
              <div className={`asgn-card__icon ${isPastDue ? "asgn-card__icon--pastdue" : isCompleted ? "asgn-card__icon--completed" : ""}`}>
                <AssignmentIcon />
              </div>
              <div className="asgn-card__info">
                <span className={`asgn-card__name ${isPastDue ? "asgn-card__name--red" : ""} ${isCompleted ? "asgn-card__name--muted" : ""}`}>{a.name}</span>
                <span className="asgn-card__due">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {isPastDue ? "Was due " : isCompleted ? "Completed " : "Due "}{formatDate(isCompleted ? a.completedAt : a.dueDate)}
                </span>
              </div>
              <div className="asgn-card__arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div className="asgn-card__menu-wrap" ref={openMenuIndex === globalIndex ? menuRef : null}>
                <button className="asgn-three-dots"
                  onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(openMenuIndex === globalIndex ? null : globalIndex); }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
                {openMenuIndex === globalIndex && (
                  <div className="asgn-dropdown">
                    {!isCompleted && (
                      <button className="asgn-dropdown__item"
                        onClick={(e) => { e.stopPropagation(); startRename(globalIndex); }}>
                        Rename
                      </button>
                    )}
                    <button className="asgn-dropdown__item asgn-dropdown__item--delete"
                      onClick={(e) => { e.stopPropagation(); deleteAssignment(globalIndex); }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )
  );

  // ── DETAIL VIEW ──
  if (detailIndex !== null) {
    const a = assignments[detailIndex];
    const isPastDue = !a.completed && new Date(a.dueDate) < now;
    const isCompleted = a.completed;
    const detailResourceInputRef = { current: null };

    const handleDetailResourceUpload = (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      Promise.all(files.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ name: file.name, type: file.type, data: ev.target.result, uploadedAt: new Date().toISOString() });
        reader.readAsDataURL(file);
      }))).then(newFiles => {
        const updated = [...assignments];
        updated[detailIndex] = { ...updated[detailIndex], resources: [...(updated[detailIndex].resources || []), ...newFiles] };
        setAssignments(updated);
      });
      e.target.value = "";
    };

    const deleteResource = (resourceIndex) => {
      const updated = [...assignments];
      updated[detailIndex].resources = updated[detailIndex].resources.filter((_, j) => j !== resourceIndex);
      setAssignments(updated);
    };

    return (
      <div className="asgn-root">
        {celebrating && (
          <div className="asgn-celebrate">
            <div className="asgn-celebrate__content">
              <div className="asgn-celebrate__circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="asgn-celebrate__text">Assignment Completed!</p>
              <p className="asgn-celebrate__sub">Great work! 🎉</p>
            </div>
            <div className="asgn-confetti">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="asgn-confetti__piece" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5]
                }} />
              ))}
            </div>
          </div>
        )}

        <nav className="asgn-nav">
          <span className="asgn-nav__logo" onClick={() => navigate("/dashboard")}>StudyForge</span>
          <button className="asgn-nav__back" onClick={() => setDetailIndex(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </nav>

        <div className="asgn-header asgn-header--detail">
          <div>
            <h1 className={`asgn-header__title ${isPastDue ? "asgn-header__title--red" : ""}`}>{a.name}</h1>
            <p className="asgn-header__sub">
              {isCompleted ? `Completed on ${formatDate(a.completedAt)}` : isPastDue ? `Was due ${formatDate(a.dueDate)}` : `Due ${formatDate(a.dueDate)}`}
            </p>
          </div>
          <div>
            {!isCompleted && !isPastDue && (
              <button className="asgn-complete-btn" onClick={() => markCompleted(detailIndex)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark as Completed
              </button>
            )}
            {isCompleted && (
              <div className="asgn-status-badge asgn-status-badge--done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Completed
              </div>
            )}
            {isPastDue && (
              <div className="asgn-status-badge asgn-status-badge--overdue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Past Due
              </div>
            )}
          </div>
        </div>

        <main className="asgn-main">
          <div className="asgn-detail">
            <div className="asgn-detail__section">
              <h2 className="asgn-detail__section-title">Details</h2>
              <div className="asgn-detail__card">
                <div className="asgn-detail__row">
                  <span className="asgn-detail__label">Assignment</span>
                  <span className="asgn-detail__value">{a.name}</span>
                </div>
                <div className="asgn-detail__divider" />
                <div className="asgn-detail__row">
                  <span className="asgn-detail__label">Due Date</span>
                  <span className={`asgn-detail__value ${isPastDue ? "asgn-detail__value--red" : ""}`}>{formatDate(a.dueDate)}</span>
                </div>
                {isCompleted && (
                  <>
                    <div className="asgn-detail__divider" />
                    <div className="asgn-detail__row">
                      <span className="asgn-detail__label">Completed On</span>
                      <span className="asgn-detail__value asgn-detail__value--green">{formatDate(a.completedAt)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="asgn-detail__section">
              <h2 className="asgn-detail__section-title">Resources</h2>
              {(a.resources || []).length === 0 ? (
                <div className="asgn-detail__empty">No resources uploaded yet.</div>
              ) : (
                <div className="asgn-detail__resources">
                  {a.resources.map((r, i) => (
                    <div key={i} className="asgn-detail__resource-card">
                      <div className="asgn-detail__resource-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <span className="asgn-detail__resource-name">{r.name}</span>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <a href={r.data} download={r.name} className="asgn-detail__resource-action" onClick={e => e.stopPropagation()}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                        {!isCompleted && (
                          <button className="asgn-detail__resource-action asgn-detail__resource-action--delete" onClick={() => deleteResource(i)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isCompleted && (
                <>
                  <input type="file" multiple style={{ display: "none" }}
                    ref={el => detailResourceInputRef.current = el}
                    onChange={handleDetailResourceUpload} />
                  <button className="asgn-detail__upload-btn" onClick={() => detailResourceInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Resources
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── MAIN LIST ──
  return (
    <div className="asgn-root">
      <nav className="asgn-nav">
        <span className="asgn-nav__logo" onClick={() => navigate("/dashboard")}>StudyForge</span>
        <button className="asgn-nav__back" onClick={() => navigate("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
      </nav>

      <div className="asgn-header">
        <div>
          <h1 className="asgn-header__title">Assignments</h1>
          <p className="asgn-header__sub">{assignments.length} total</p>
        </div>
      </div>

      <TabNav />

      <main className="asgn-main">
        {activeTab === "active" && <CardList list={activeAssignments} />}
        {activeTab === "completed" && <CardList list={completedAssignments} isCompleted />}
        {activeTab === "pastdue" && <CardList list={pastDueAssignments} isPastDue />}
      </main>

      {activeTab === "active" && (
        <div className="asgn-fab-wrap">
          <button className="asgn-fab" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {showModal && (
        <div className="asgn-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="asgn-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="asgn-modal__title">New Assignment</h2>
            <p className="asgn-modal__sub">Fill in the details for your assignment</p>
            <div className="asgn-modal__field">
              <label className="asgn-modal__label">Assignment Name</label>
              <input className="asgn-modal__input" type="text" placeholder="e.g. Data Structures Lab Report"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="asgn-modal__field">
              <label className="asgn-modal__label">Due Date</label>
              <input className="asgn-modal__input" type="date"
                value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="asgn-modal__field">
              <label className="asgn-modal__label">Resources</label>
              <button className="asgn-modal__resources-btn" onClick={() => resourceInputRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {form.resources.length > 0 ? `${form.resources.length} file${form.resources.length !== 1 ? "s" : ""} selected` : "Add Resources"}
              </button>
              <input ref={resourceInputRef} type="file" multiple style={{ display: "none" }} onChange={handleResourceUpload} />
              {form.resources.length > 0 && (
                <div className="asgn-modal__resource-list">
                  {form.resources.map((r, i) => (
                    <div key={i} className="asgn-modal__resource-item">
                      <span>{r.name}</span>
                      <button onClick={() => setForm(prev => ({ ...prev, resources: prev.resources.filter((_, j) => j !== i) }))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="asgn-modal__actions">
              <button className="asgn-modal__btn asgn-modal__btn--cancel"
                onClick={() => { setShowModal(false); setForm({ name: "", dueDate: "", resources: [] }); }}>
                Cancel
              </button>
              <button className="asgn-modal__btn asgn-modal__btn--add" onClick={addAssignment}>
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="db-footer">
        <span className="db-footer__logo">StudyForge</span>
        <span className="db-footer__tagline">Your AI-powered study companion</span>
      </footer>
    </div>
  );
}