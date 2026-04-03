// src/components/Dashboard.js
import React, { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { useAuth } from "../contexts/AuthContext";
import OrderCard from "./OrderCard";
import OrderForm from "./OrderForm";
import LoginScreen from "./LoginScreen";

const STAGES = [
  { key: "prep",      label: "PREP / POUR", icon: "🪣", color: "#3b82f6" },
  { key: "curing",    label: "CURING",       icon: "⏳", color: "#a855f7" },
  { key: "paint",     label: "PAINT",        icon: "🖌️", color: "#f59e0b" },
  { key: "shipping",  label: "SHIPPING",     icon: "📦", color: "#22c55e" },
  { key: "completed", label: "COMPLETED",    icon: "✅", color: "#64748b" },
];

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const { currentUser, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("prep");
  const [showLogin, setShowLogin] = useState(false);

  const byStage = (key) => orders.filter((o) => o.status === key);
  const activeStage = STAGES.find((s) => s.key === activeTab);

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.rock}>🪨</span>
          <div>
            <h1 style={styles.brand}>SLICKROCK</h1>
            <p style={styles.brandSub}>Production Tracker</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {currentUser ? (
            <>
              <button style={styles.addBtn} onClick={() => setShowForm(true)}>+ ORDER</button>
              <button style={styles.logoutBtn} onClick={logout}>OUT</button>
            </>
          ) : (
            <button style={styles.managerBtn} onClick={() => setShowLogin(true)}>MANAGER LOGIN</button>
          )}
        </div>
      </header>

      {/* Stage Tabs */}
      <nav style={styles.tabs}>
        {STAGES.map((s) => {
          const count = byStage(s.key).length;
          const active = activeTab === s.key;
          return (
            <button
              key={s.key}
              style={{
                ...styles.tab,
                ...(active ? { borderBottomColor: s.color, color: "#fff" } : {}),
              }}
              onClick={() => setActiveTab(s.key)}
            >
              <span style={styles.tabIcon}>{s.icon}</span>
              <span style={styles.tabLabel}>{s.label}</span>
              <span style={{
                ...styles.tabBadge,
                background: active ? s.color : "#2a2a2a",
                color: active ? "#fff" : "#666",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Stage header bar */}
      <div style={{ ...styles.stageBar, borderLeftColor: activeStage.color }}>
        <span style={{ color: activeStage.color, fontSize: "20px" }}>{activeStage.icon}</span>
        <span style={styles.stageName}>{activeStage.label}</span>
        <span style={styles.stageCount}>{byStage(activeTab).length} orders</span>
        {!currentUser && (
          <span style={styles.loginHint}>🔒 Login to move orders</span>
        )}
      </div>

      {/* Order Cards */}
      <main style={styles.main}>
        {loading && <p style={styles.empty}>Loading...</p>}
        {!loading && byStage(activeTab).length === 0 && (
          <p style={styles.empty}>No orders in this stage.</p>
        )}
        {!loading && byStage(activeTab).map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </main>

      {showForm && <OrderForm onClose={() => setShowForm(false)} />}
      {showLogin && !currentUser && (
        <div style={styles.loginOverlay} onClick={() => setShowLogin(false)}>
          <div onClick={e => e.stopPropagation()}>
            <LoginScreen onSuccess={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#0f0f0f", color: "#fff",
    fontFamily: "'Inter', sans-serif", maxWidth: "480px", margin: "0 auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 16px 12px", borderBottom: "1px solid #1e1e1e",
    position: "sticky", top: 0, background: "#0f0f0f", zIndex: 50,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  rock: { fontSize: "28px" },
  brand: {
    fontFamily: "'Oswald', sans-serif", fontSize: "18px",
    letterSpacing: "5px", margin: 0, color: "#fff",
  },
  brandSub: {
    fontFamily: "'Oswald', sans-serif", fontSize: "9px",
    letterSpacing: "2px", color: "#e86a2f", margin: 0,
  },
  headerRight: { display: "flex", gap: "8px", alignItems: "center" },
  addBtn: {
    background: "#e86a2f", color: "#fff", border: "none", borderRadius: "8px",
    padding: "8px 14px", fontSize: "12px", fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px", cursor: "pointer",
  },
  logoutBtn: {
    background: "transparent", color: "#555", border: "1px solid #2a2a2a",
    borderRadius: "8px", padding: "8px 12px", fontSize: "11px",
    fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer",
  },
  managerBtn: {
    background: "transparent", color: "#555", border: "1px solid #2a2a2a",
    borderRadius: "8px", padding: "8px 12px", fontSize: "10px",
    fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer",
  },
  tabs: {
    display: "flex", overflowX: "auto",
    borderBottom: "1px solid #1e1e1e", scrollbarWidth: "none",
  },
  tab: {
    flex: "0 0 auto", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "4px", padding: "10px 12px",
    background: "none", border: "none", borderBottom: "2px solid transparent",
    color: "#555", cursor: "pointer", transition: "color 0.2s, border-color 0.2s",
    minWidth: "72px",
  },
  tabIcon: { fontSize: "16px" },
  tabLabel: {
    fontSize: "7px", fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px", whiteSpace: "nowrap",
  },
  tabBadge: {
    borderRadius: "10px", padding: "1px 7px", fontSize: "11px",
    fontFamily: "'Oswald', sans-serif", fontWeight: 600,
    transition: "background 0.2s, color 0.2s",
  },
  stageBar: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 16px", borderLeft: "3px solid",
    margin: "16px 16px 8px", background: "#141414", borderRadius: "0 8px 8px 0",
  },
  stageName: {
    fontFamily: "'Oswald', sans-serif", fontSize: "14px",
    letterSpacing: "3px", color: "#fff", flex: 1,
  },
  stageCount: { color: "#555", fontSize: "12px", fontFamily: "'Inter', sans-serif" },
  loginHint: {
    color: "#444", fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px",
  },
  main: { padding: "8px 16px 32px" },
  empty: {
    color: "#444", textAlign: "center", padding: "48px 0",
    fontFamily: "'Oswald', sans-serif", letterSpacing: "2px", fontSize: "13px",
  },
  loginOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    zIndex: 200, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "20px",
  },
};
