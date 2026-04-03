// src/components/LoginScreen.js
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🪨</span>
          <h1 style={styles.logoText}>SLICKROCK</h1>
          <p style={styles.logoSub}>Manager Portal</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@slickrock.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f0f",
    padding: "20px",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
    padding: "40px 32px",
    width: "100%",
    maxWidth: "380px",
  },
  logo: {
    textAlign: "center",
    marginBottom: "36px",
  },
  logoIcon: {
    fontSize: "40px",
    display: "block",
    marginBottom: "8px",
  },
  logoText: {
    color: "#ffffff",
    fontSize: "24px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "6px",
    margin: "0 0 4px 0",
  },
  logoSub: {
    color: "#e86a2f",
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    margin: 0,
    fontFamily: "'Oswald', sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#888",
    fontSize: "10px",
    letterSpacing: "2px",
    fontFamily: "'Oswald', sans-serif",
  },
  input: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "14px 16px",
    color: "#fff",
    fontSize: "16px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
  },
  error: {
    color: "#ff4444",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
  },
  btn: {
    background: "#e86a2f",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "16px",
    fontSize: "13px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "3px",
    cursor: "pointer",
    marginTop: "4px",
  },
};
