// src/components/Dashboard.js
import React, { useState, useRef, useEffect } from "react";
import { useOrders } from "../hooks/useOrders";
import { useAuth } from "../contexts/AuthContext";
import InvoiceStack from "./InvoiceStack";
import OrderForm from "./OrderForm";
import LoginScreen from "./LoginScreen";

const STAGES = [
  { key: "orders",    label: "ORDERS",       icon: "📋", color: "#6366f1" },
  { key: "prep",      label: "PREP / POUR",  icon: "🪣", color: "#3b82f6" },
  { key: "curing",    label: "CURING",       icon: "⏳", color: "#a855f7" },
  { key: "paint",     label: "PAINT",        icon: "🖌️", color: "#f59e0b" },
  { key: "shipping",  label: "SHIPPING",     icon: "📦", color: "#22c55e" },
  { key: "completed", label: "COMPLETED",    icon: "✅", color: "#64748b" },
];

function groupByInvoice(orders, stage) {
  const inStage = orders.filter((o) => o.status === stage);
  const groups = {};
  for (const order of inStage) {
    const key = order.invoice || order.id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
  }
  return groups;
}

// Check if an order matches the search query
function orderMatches(order, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (order.invoice || "").toLowerCase().includes(q) ||
    (order.customer || "").toLowerCase().includes(q) ||
    (order.po || "").toLowerCase().includes(q) ||
    (order.itemName || "").toLowerCase().includes(q) ||
    (order.color || "").toLowerCase().includes(q) ||
    (order.notes || "").toLowerCase().includes(q)
  );
}

// Check if an order matches the unit filter (e.g. "2" matches "2 OF 4")
function unitMatches(order, unitQuery) {
  if (!unitQuery) return true;
  const q = unitQuery.trim();
  const unitNum = (order.quantity || "").split(" OF ")[0] || "";
  return unitNum === q;
}

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const { currentUser, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [showLogin, setShowLogin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unitQuery, setUnitQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  function clearSearch() {
    setSearchQuery("");
    setUnitQuery("");
    setSearchOpen(false);
  }

  const isSearching = searchQuery.trim() !== "" || unitQuery.trim() !== "";

  // When searching: show results across ALL stages
  const searchResults = isSearching
    ? orders.filter((o) => orderMatches(o, searchQuery) && unitMatches(o, unitQuery))
    : [];

  // Group search results by invoice, annotated with their stage
  const searchGroups = {};
  for (const order of searchResults) {
    const key = order.invoice || order.id;
    if (!searchGroups[key]) searchGroups[key] = [];
    searchGroups[key].push(order);
  }

  // Normal tab view
  const activeStage = STAGES.find((s) => s.key === activeTab);
  const groups = groupByInvoice(orders, activeTab);
  const groupCount = Object.keys(groups).length;
  const unitCount = orders.filter((o) => o.status === activeTab).length;

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        {searchOpen ? (
          <div style={styles.searchBar}>
            <input
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Invoice #, customer, PO, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={styles.searchClear} onClick={clearSearch}>✕</button>
          </div>
        ) : (
          <>
            <div style={styles.headerLeft}>
              <img src="/Slick-Rock-Logo-White-e1546982507174.png" alt="Slickrock Concrete" style={styles.headerLogo} />
            </div>
            <div style={styles.headerRight}>
              <button style={styles.searchIcon} onClick={() => setSearchOpen(true)}>🔍</button>
              {currentUser ? (
                <>
                  <button style={styles.addBtn} onClick={() => setShowForm(true)}>+ ORDER</button>
                  <button style={styles.logoutBtn} onClick={logout}>OUT</button>
                </>
              ) : (
                <button style={styles.managerBtn} onClick={() => setShowLogin(true)}>MANAGER LOGIN</button>
              )}
            </div>
          </>
        )}
      </header>

      {/* Unit filter — only shows when searching */}
      {searchOpen && (
        <div style={styles.unitFilterBar}>
          <span style={styles.unitFilterLabel}>UNIT #</span>
          <input
            style={styles.unitFilterInput}
            placeholder="e.g. 2  (finds 2 of 4)"
            value={unitQuery}
            onChange={(e) => setUnitQuery(e.target.value)}
            type="number"
            min="1"
          />
          {isSearching && (
            <span style={styles.resultCount}>
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Search results view */}
      {isSearching ? (
        <main style={styles.main}>
          {searchResults.length === 0 && (
            <p style={styles.empty}>No orders found.</p>
          )}
          {Object.entries(searchGroups).map(([invoice, units]) => (
            <div key={invoice}>
              {/* Stage badges for search results */}
              <div style={styles.stageBadgeRow}>
                {[...new Set(units.map((u) => u.status))].map((s) => {
                  const stage = STAGES.find((st) => st.key === s);
                  return (
                    <span key={s} style={{ ...styles.stageBadge, background: stage?.color + "22", color: stage?.color, borderColor: stage?.color }}>
                      {stage?.icon} {stage?.label}
                    </span>
                  );
                })}
              </div>
              <InvoiceStack invoice={invoice} units={units} allOrders={orders} />
            </div>
          ))}
        </main>
      ) : (
        <>
          {/* Stage Tabs */}
          <nav style={styles.tabs}>
            {STAGES.map((s) => {
              const count = orders.filter((o) => o.status === s.key).length;
              const active = activeTab === s.key;
              return (
                <button key={s.key}
                  style={{ ...styles.tab, ...(active ? { borderBottomColor: s.color, color: "#fff" } : {}) }}
                  onClick={() => setActiveTab(s.key)}>
                  <span style={styles.tabIcon}>{s.icon}</span>
                  <span style={styles.tabLabel}>{s.label}</span>
                  <span style={{ ...styles.tabBadge, background: active ? s.color : "#2a2a2a", color: active ? "#fff" : "#666" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Stage bar */}
          <div style={{ ...styles.stageBar, borderLeftColor: activeStage.color }}>
            <span style={{ color: activeStage.color, fontSize: "20px" }}>{activeStage.icon}</span>
            <span style={styles.stageName}>{activeStage.label}</span>
            <span style={styles.stageCount}>
              {groupCount} {groupCount === 1 ? "invoice" : "invoices"} · {unitCount} units
            </span>
            {!currentUser && <span style={styles.loginHint}>🔒 Login to move orders</span>}
          </div>

          {/* Invoice Stacks */}
          <main style={styles.main}>
            {loading && <p style={styles.empty}>Loading...</p>}
            {!loading && groupCount === 0 && <p style={styles.empty}>No orders in this stage.</p>}
            {!loading && Object.entries(groups).map(([invoice, units]) => (
              <InvoiceStack key={invoice} invoice={invoice} units={units} allOrders={orders} />
            ))}
          </main>
        </>
      )}

      {showForm && <OrderForm onClose={() => setShowForm(false)} allOrders={orders} />}
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
  root: { minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "'Inter', sans-serif", maxWidth: "480px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, background: "#0f0f0f", zIndex: 50, minHeight: "60px" },
  headerLeft: { display: "flex", alignItems: "center" },
  headerLogo: { height: "42px", objectFit: "contain" },
  headerRight: { display: "flex", gap: "8px", alignItems: "center" },
  searchIcon: { background: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#aaa", fontSize: "16px", padding: "6px 10px", cursor: "pointer" },
  searchBar: { display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  searchInput: { flex: 1, background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "10px 14px", color: "#fff", fontSize: "14px", fontFamily: "'Inter', sans-serif", outline: "none" },
  searchClear: { background: "#2a2a2a", border: "none", color: "#aaa", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", cursor: "pointer" },
  unitFilterBar: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "#111", borderBottom: "1px solid #1e1e1e" },
  unitFilterLabel: { color: "#555", fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "2px", whiteSpace: "nowrap" },
  unitFilterInput: { flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "14px", fontFamily: "'Inter', sans-serif", outline: "none" },
  resultCount: { color: "#555", fontSize: "11px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", whiteSpace: "nowrap" },
  stageBadgeRow: { display: "flex", gap: "6px", padding: "8px 0 4px", flexWrap: "wrap" },
  stageBadge: { fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", padding: "3px 8px", borderRadius: "20px", border: "1px solid" },
  addBtn: { background: "#e86a2f", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer" },
  logoutBtn: { background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "8px 12px", fontSize: "11px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer" },
  managerBtn: { background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "8px 12px", fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer" },
  tabs: { display: "flex", overflowX: "auto", borderBottom: "1px solid #1e1e1e", scrollbarWidth: "none" },
  tab: { flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 10px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#555", cursor: "pointer", transition: "color 0.2s, border-color 0.2s", minWidth: "68px" },
  tabIcon: { fontSize: "16px" },
  tabLabel: { fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", whiteSpace: "nowrap" },
  tabBadge: { borderRadius: "10px", padding: "1px 7px", fontSize: "12px", fontFamily: "'Oswald', sans-serif", fontWeight: 600, transition: "background 0.2s, color 0.2s" },
  stageBar: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderLeft: "3px solid", margin: "16px 16px 8px", background: "#141414", borderRadius: "0 8px 8px 0" },
  stageName: { fontFamily: "'Oswald', sans-serif", fontSize: "14px", letterSpacing: "3px", color: "#fff", flex: 1 },
  stageCount: { color: "#555", fontSize: "11px", fontFamily: "'Inter', sans-serif" },
  loginHint: { color: "#444", fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" },
  main: { padding: "8px 16px 32px" },
  empty: { color: "#444", textAlign: "center", padding: "48px 0", fontFamily: "'Oswald', sans-serif", letterSpacing: "2px", fontSize: "13px" },
  loginOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
};
