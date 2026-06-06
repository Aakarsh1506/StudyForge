import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import heroBg from "../assets/Background-LandingPage-StudyForge-2.png";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Upload PDF & Organize Notes",
    desc: "Seamlessly upload your PDFs and organize all your study materials in one centralized location. Never lose track of important documents again.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Upload Timetable & Visualize",
    desc: "Import your class schedule and view it in an intuitive, easy-to-read format. Stay on top of your daily commitments effortlessly.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "Assignment Tracking",
    desc: "Keep track of all your assignments, deadlines, and submissions. Get timely reminders so you never miss an important due date.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "AI Study Assistant",
    desc: "Generate flashcards automatically, create custom quizzes, and get personalized study plans powered by advanced AI to maximize your learning efficiency.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-root">

      {/* NAVBAR */}
      <nav className="lp-nav">
        <span className="lp-nav__logo">StudyForge</span>
        <div className="lp-nav__actions">
          <button className="lp-btn lp-btn--nav-pill-primary" onClick={() => navigate('/auth')}>Login</button>
          <button className="lp-btn lp-btn--nav-pill-ghost" onClick={() => navigate('/auth')}>Sign Up</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="lp-hero__content">
          <h1 className="lp-hero__title">StudyForge</h1>
          <p className="lp-hero__tagline">
            Your complete study companion for organizing notes, tracking
            assignments, and planning smarter.
          </p>
        </div>
        <div className="lp-hero__cta" style={{ position: "absolute", bottom: "2.8rem", left: "2.8rem", display: "flex", gap: "1rem" }}>
          <button className="lp-btn lp-btn--pill-primary" onClick={() => navigate('/auth')}>Login</button>
          <button className="lp-btn lp-btn--pill-ghost" onClick={() => navigate('/auth')}>Sign Up</button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features">
        <div className="lp-features__header">
          <h2 className="lp-features__title">Powerful Features</h2>
          <p className="lp-features__sub">
            Everything you need to succeed academically, all in one place
          </p>
        </div>
        <div className="lp-features__grid" style={{ gap: "3rem" }}>
          {features.map((f, i) => (
            <div key={i} className="lp-card" onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>
              <div className="lp-card__icon-wrap">{f.icon}</div>
              <h3 className="lp-card__title">{f.title}</h3>
              <p className="lp-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span className="lp-footer__logo">StudyForge</span>
          <p className="lp-footer__copy">
            © {new Date().getFullYear()} StudyForge. Built for students.
          </p>
        </div>
      </footer>

    </div>
  );
}