import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NotesPage.css";

export default function NotesPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState(() => JSON.parse(localStorage.getItem("sf-folders") || "[]"));
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [renameIndex, setRenameIndex] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [openFolder, setOpenFolder] = useState(null); // folder index
  const [pdfViewer, setPdfViewer] = useState(null); // { name, url }
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderFileInputRef = useRef(null);

  useEffect(() => { localStorage.setItem("sf-folders", JSON.stringify(folders)); }, [folders]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuIndex(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createFolder = () => {
    if (!folderName.trim()) return;
    setFolders([...folders, { name: folderName.trim(), createdAt: new Date().toISOString(), files: [] }]);
    setFolderName("");
    setShowFolderModal(false);
  };

  const deleteFolder = (index) => { setFolders(folders.filter((_, i) => i !== index)); setOpenMenuIndex(null); };

  const startRename = (index) => { setRenameIndex(index); setRenameName(folders[index].name); setOpenMenuIndex(null); };

  const confirmRename = () => {
    if (!renameName.trim()) return;
    const updated = [...folders];
    updated[renameIndex] = { ...updated[renameIndex], name: renameName.trim() };
    setFolders(updated);
    setRenameIndex(null);
  };

  // Upload PDF into a folder
  const handleFolderFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || openFolder === null) return;
    const updated = [...folders];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updated[openFolder] = {
          ...updated[openFolder],
          files: [...(updated[openFolder].files || []), {
            name: file.name,
            type: file.type,
            data: ev.target.result,
            uploadedAt: new Date().toISOString(),
          }]
        };
        setFolders([...updated]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Upload notes from subheader (creates loose files, opens first available folder or prompts)
  const handleUploadNotes = () => {
    if (folders.length === 0) { setShowFolderModal(true); return; }
    setOpenFolder(0);
    setTimeout(() => folderFileInputRef.current?.click(), 100);
  };

  const deleteFile = (folderIndex, fileIndex) => {
    const updated = [...folders];
    updated[folderIndex].files = updated[folderIndex].files.filter((_, i) => i !== fileIndex);
    setFolders(updated);
  };

  const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const PDFIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );

  // ── PDF VIEWER ──
  if (pdfViewer) {
    return (
      <div className="notes-root">
        <nav className="notes-nav">
          <span className="notes-nav__logo" onClick={() => navigate("/dashboard")}>StudyForge</span>
          <button className="notes-nav__back" onClick={() => setPdfViewer(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Folder
          </button>
        </nav>
        <div className="notes-pdf-viewer-header">
          <span className="notes-pdf-viewer-name">{pdfViewer.name}</span>
        </div>
        <div className="notes-pdf-viewer">
          {pdfViewer.type === "application/pdf" ? (
            <iframe src={pdfViewer.data} title={pdfViewer.name} className="notes-pdf-frame" />
          ) : (
            <img src={pdfViewer.data} alt={pdfViewer.name} className="notes-pdf-image" />
          )}
        </div>
      </div>
    );
  }

  // ── FOLDER VIEW ──
  if (openFolder !== null) {
    const folder = folders[openFolder];
    return (
      <div className="notes-root">
        <nav className="notes-nav">
          <span className="notes-nav__logo" onClick={() => navigate("/dashboard")}>StudyForge</span>
          <button className="notes-nav__back" onClick={() => setOpenFolder(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Notes
          </button>
        </nav>

        <div className="notes-header">
          <div>
            <h1 className="notes-header__title">{folder.name}</h1>
            <p className="notes-header__sub">{(folder.files || []).length} file{(folder.files || []).length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <main className="notes-main">
          {(folder.files || []).length === 0 ? (
            <div className="notes-empty" onClick={() => folderFileInputRef.current?.click()}>
              <div className="notes-empty__icon">+</div>
              <p className="notes-empty__title">No files yet</p>
              <p className="notes-empty__sub">Click to upload a PDF or image</p>
            </div>
          ) : (
            <div className="notes-grid">
              {folder.files.map((file, i) => (
                <div key={i} className="notes-folder-card" style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => setPdfViewer(file)}>
                  <div className="notes-folder-card__icon notes-folder-card__icon--pdf">
                    <PDFIcon />
                  </div>
                  <div className="notes-folder-card__info">
                    <span className="notes-folder-card__name">{file.name}</span>
                    <span className="notes-folder-card__meta">
                      Uploaded {new Date(file.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="notes-folder-card__arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <button className="notes-three-dots" onClick={(e) => { e.stopPropagation(); deleteFile(openFolder, i); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        <input ref={folderFileInputRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleFolderFileUpload} />

        <div className="notes-fab-wrap">
          <button className="notes-fab" onClick={() => folderFileInputRef.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN NOTES PAGE ──
  return (
    <div className="notes-root">
      <nav className="notes-nav">
        <span className="notes-nav__logo" onClick={() => navigate("/dashboard")}>StudyForge</span>
        <button className="notes-nav__back" onClick={() => navigate("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
      </nav>

      <div className="notes-header">
        <div>
          <h1 className="notes-header__title">My Notes</h1>
          <p className="notes-header__sub">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <main className="notes-main">
        {folders.length === 0 ? (
          <div className="notes-empty">
            <div className="notes-empty__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="notes-empty__title">No folders yet</p>
            <p className="notes-empty__sub">Create a folder or upload notes to get started</p>
          </div>
        ) : (
          <div className="notes-grid">
            {folders.map((folder, i) => (
              <div key={i} className="notes-folder-card" style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => setOpenFolder(i)}>
                <div className="notes-folder-card__icon">
                  <FolderIcon />
                </div>
                <div className="notes-folder-card__info">
                  {renameIndex === i ? (
                    <input className="notes-rename-input" value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenameIndex(null); }}
                      onBlur={confirmRename} autoFocus onClick={(e) => e.stopPropagation()} />
                  ) : (
                    <span className="notes-folder-card__name">{folder.name}</span>
                  )}
                  <span className="notes-folder-card__meta">
                    {(folder.files || []).length} file{(folder.files || []).length !== 1 ? "s" : ""} · Created {new Date(folder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="notes-folder-card__arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <div className="notes-folder-card__menu-wrap" ref={openMenuIndex === i ? menuRef : null}>
                  <button className="notes-three-dots"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(openMenuIndex === i ? null : i); }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                  {openMenuIndex === i && (
                    <div className="notes-dropdown">
                      <button className="notes-dropdown__item" onClick={(e) => { e.stopPropagation(); startRename(i); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Rename
                      </button>
                      <button className="notes-dropdown__item notes-dropdown__item--delete"
                        onClick={(e) => { e.stopPropagation(); deleteFolder(i); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleUploadNotes} />

      <div className="notes-fab-wrap">
        {fabOpen && (
          <div className="notes-fab-menu">
            <button className="notes-fab-menu__item" onClick={() => { setShowFolderModal(true); setFabOpen(false); }}>
              <div className="notes-fab-menu__item-icon"><FolderIcon /></div>
              New Folder
            </button>
            <button className="notes-fab-menu__item" onClick={() => { setFabOpen(false); fileInputRef.current?.click(); }}>
              <div className="notes-fab-menu__item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              Upload Notes
            </button>
          </div>
        )}
        <button className={`notes-fab ${fabOpen ? "notes-fab--open" : ""}`} onClick={() => setFabOpen(!fabOpen)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {showFolderModal && (
        <div className="notes-modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="notes-modal__title">New Folder</h2>
            <p className="notes-modal__sub">Enter a name for your folder</p>
            <input className="notes-modal__input" type="text" placeholder="Folder name"
              value={folderName} onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowFolderModal(false); }}
              autoFocus />
            <div className="notes-modal__actions">
              <button className="notes-modal__btn notes-modal__btn--cancel" onClick={() => setShowFolderModal(false)}>Cancel</button>
              <button className="notes-modal__btn notes-modal__btn--create" onClick={createFolder}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}