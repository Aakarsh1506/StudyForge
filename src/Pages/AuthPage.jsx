import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";
import bgImage from "../assets/Background-LandingPage-StudyForge-2.png";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginStatus, setLoginStatus] = useState({ msg: "", type: "" });
  const [signupStatus, setSignupStatus] = useState({ msg: "", type: "" });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const loginPwTimer = useRef(null);
  const signupPwTimer = useRef(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    collegeName: "",
    yearOfCollege: "",
    branch: "",
    password: "",
  });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
  };

  const peekPassword = (type) => {
    if (type === "login") {
      if (!loginForm.password) return;
      setShowLoginPw(true);
      clearTimeout(loginPwTimer.current);
      loginPwTimer.current = setTimeout(() => setShowLoginPw(false), 1000);
    } else {
      if (!signupForm.password) return;
      setShowSignupPw(true);
      clearTimeout(signupPwTimer.current);
      signupPwTimer.current = setTimeout(() => setShowSignupPw(false), 1000);
    }
  };

  // ── LOGIN ──
  const handleLogin = async () => {
    const { email, password } = loginForm;
    if (!email || !password) {
      setLoginStatus({ msg: "> ERROR: All fields are required.", type: "err" });
      return;
    }
    setLoginLoading(true);
    setLoginStatus({ msg: "", type: "" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginStatus({ msg: `> ERROR: ${data.message}`, type: "err" });
        setLoginLoading(false);
        return;
      }
      setLoginSuccess(true);
      setLoginStatus({ msg: "> Login successful.", type: "ok" });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch {
      setLoginStatus({ msg: "> ERROR: Could not connect to server.", type: "err" });
      setLoginLoading(false);
    }
  };

  // ── SIGNUP ──
  const handleSignup = async () => {
    const { name, email, collegeName, yearOfCollege, branch, password } = signupForm;
    if (!name || !email || !collegeName || !yearOfCollege || !branch || !password) {
      setSignupStatus({ msg: "> ERROR: All fields are required.", type: "err" });
      return;
    }
    setSignupLoading(true);
    setSignupStatus({ msg: "", type: "" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupStatus({ msg: `> ERROR: ${data.message}`, type: "err" });
        setSignupLoading(false);
        return;
      }
      setSignupSuccess(true);
      setSignupStatus({ msg: "> Account created successfully.", type: "ok" });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch {
      setSignupStatus({ msg: "> ERROR: Could not connect to server.", type: "err" });
      setSignupLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLoginStatus({ msg: "", type: "" });
    setSignupStatus({ msg: "", type: "" });
    setLoginSuccess(false);
    setSignupSuccess(false);
    setLoginLoading(false);
    setSignupLoading(false);
  };

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="auth-bg" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="auth-overlay" />

      <div
        className="auth-logo"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        StudyForge
      </div>

      <div className="auth-card">

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <div className="auth-form">
            <p className="auth-subtitle">Welcome back. Log in to continue.</p>

            <div className="field">
              <input
                type="email"
                name="email"
                id="login-email"
                placeholder=" "
                value={loginForm.email}
                onChange={handleLoginChange}
                autoComplete="off"
              />
              <label htmlFor="login-email">Email ID</label>
            </div>

            <div className="field pw-field">
              <input
                type={showLoginPw ? "text" : "password"}
                name="password"
                id="login-password"
                placeholder=" "
                value={loginForm.password}
                onChange={handleLoginChange}
              />
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className={`eye-btn ${showLoginPw ? "peeking" : ""}`}
                onClick={() => peekPassword("login")}
              >
                {showLoginPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>

            {loginStatus.msg && (
              <p className={`auth-status ${loginStatus.type}`}>{loginStatus.msg}</p>
            )}

            <button
              className={`auth-submit-btn ${loginSuccess ? "success" : ""}`}
              onClick={handleLogin}
              disabled={loginLoading || loginSuccess}
            >
              {loginSuccess ? "ACCESS GRANTED" : loginLoading ? "AUTHENTICATING..." : "Log In"}
            </button>

            <p className="auth-switch">
              New to StudyForge?{" "}
              <span onClick={() => switchMode("signup")}>Sign up here</span>
            </p>
          </div>
        )}

        {/* ── SIGNUP ── */}
        {mode === "signup" && (
          <div className="auth-form">
            <p className="auth-subtitle">Create your account and start forging.</p>

            <div className="field">
              <input
                type="text"
                name="name"
                id="signup-name"
                placeholder=" "
                value={signupForm.name}
                onChange={handleSignupChange}
              />
              <label htmlFor="signup-name">Name</label>
            </div>

            <div className="field">
              <input
                type="email"
                name="email"
                id="signup-email"
                placeholder=" "
                value={signupForm.email}
                onChange={handleSignupChange}
              />
              <label htmlFor="signup-email">Email ID</label>
            </div>

            <div className="field">
              <input
                type="text"
                name="collegeName"
                id="signup-college"
                placeholder=" "
                value={signupForm.collegeName}
                onChange={handleSignupChange}
              />
              <label htmlFor="signup-college">College Name</label>
            </div>

            <div className="sf-row">
              <div className="field">
                <input
                  type="text"
                  name="yearOfCollege"
                  id="signup-year"
                  placeholder=" "
                  value={signupForm.yearOfCollege}
                  onChange={handleSignupChange}
                />
                <label htmlFor="signup-year">Year</label>
              </div>

              <div className="field">
                <input
                  type="text"
                  name="branch"
                  id="signup-branch"
                  placeholder=" "
                  value={signupForm.branch}
                  onChange={handleSignupChange}
                />
                <label htmlFor="signup-branch">Branch</label>
              </div>
            </div>

            <div className="field pw-field">
              <input
                type={showSignupPw ? "text" : "password"}
                name="password"
                id="signup-password"
                placeholder=" "
                value={signupForm.password}
                onChange={handleSignupChange}
              />
              <label htmlFor="signup-password">Password</label>
              <button
                type="button"
                className={`eye-btn ${showSignupPw ? "peeking" : ""}`}
                onClick={() => peekPassword("signup")}
              >
                {showSignupPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>

            {signupStatus.msg && (
              <p className={`auth-status ${signupStatus.type}`}>{signupStatus.msg}</p>
            )}

            <button
              className={`auth-submit-btn ${signupSuccess ? "success" : ""}`}
              onClick={handleSignup}
              disabled={signupLoading || signupSuccess}
            >
              {signupSuccess ? "REGISTERED ✓" : signupLoading ? "CREATING ACCOUNT..." : "Sign Up"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <span onClick={() => switchMode("login")}>Log in here</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}