// src/components/OrderCard.js
import React, { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { useAuth } from "../contexts/AuthContext";
import OrderForm from "./OrderForm";

const STAGE_LABELS = {
  prep: { next: "CURING", nextLabel: "→ SENT TO CURE", color: "#3b82f6" },
  curing: { next: "PAINT", nextLabel: "→ READY TO PAINT", color: "#a855f7" },
  paint: { next: "SHIPPING", nextLabel: "→ DONE PAINTING", color: "#f59e0b" },
  shipping: { next: null, nextLabel: "✓ SHIPPED", color: "#22c55e" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

export default function OrderCard({ order }) {
  const { advanceOrder, deleteOrder } = useOrders();
  const { currentUser } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const stage = STAGE_LABELS[order.status];

  async function handleAdvance() {
    setAdvancing(true);
    await advanceOrder(order.id, order.status);
    setAdvancing(false);
  }

  return (
    <>
      <div style={styles.card}>
        {/* Top color accent */}
        <div style={{ ...styles.accent, background: stage.color }} />

        {/* Invoice + Customer */}
        <div style={styles.topRow}>
          <span style={styles.invoice}>#{order.invoice}{order.po ? ` · PO: ${order.po}` : ""}</span>
          <span style={styles.customer}>{order.customer}</span>
        </div>

        {/* Item name */}
        <p style={styles.itemName}>{order.itemName}</p>

        {/* Key specs always visible */}
        <div style={styles.specs}>
          <Spec label="QTY" value={order.quantity || "—"} />
          <Spec label="COLOR" value={order.color || "—"} highlight />
          <Spec label="HOLE" value={order.holeSize || "—"} />
          <Spec label="SEALER" value={order.elastomericSealer || "No"} highlight={order.elastomericSealer === "Yes"} />
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={styles.expandedSection}>
            <div style={styles.expandedGrid}>
              <Spec label="ORDER DATE" value={formatDate(order.orderDate)} />
              <Spec label="POUR DATE" value={formatDate(order.pourDate)} />
              <Spec label="LINER" value={order.liner || "—"} />
              <Spec label="SCUPPER" value={order.scupper || "—"} />
            </div>
            {order.notes && (
              <p style={styles.notes}>📝 {order.notes}</p>
            )}
          </div>
        )}

        {/* Expand / Collapse toggle */}
        <button style={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "▲ LESS" : "▼ MORE DETAILS"}
        </button>

        {/* Advance button */}
        {order.status !== "shipping" && (
          <button
            style={{ ...styles.advanceBtn, borderColor: stage.color, color: stage.color }}
            onClick={handleAdvance}
            disabled={advancing}
          >
            {advancing ? "MOVING..." : stage.nextLabel}
          </button>
        )}

        {order.status === "shipping" && (
          <div style={styles.shippedBadge}>✓ IN SHIPPING BAY</div>
        )}

        {/* Manager-only actions */}
        {currentUser && (
          <div style={styles.managerRow}>
            <button style={styles.editBtn} onClick={() => setShowEdit(true)}>✎ EDIT</button>
            {confirmDelete ? (
              <>
                <span style={styles.confirmText}>Delete?</span>
                <button style={styles.confirmYes} onClick={() => deleteOrder(order.id)}>YES</button>
                <button style={styles.confirmNo} onClick={() => setConfirmDelete(false)}>NO</button>
              </>
            ) : (
              <button style={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>✕ DELETE</button>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <OrderForm editOrder={order} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}

function Spec({ label, value, highlight }) {
  return (
    <div style={styles.spec}>
      <span style={styles.specLabel}>{label}</span>
      <span style={{ ...styles.specValue, ...(highlight ? styles.specHighlight : {}) }}>{value}</span>
    </div>
  );
}

const styles = {
  card: {
    background: "#1c1c1c",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "0 0 14px 0",
    marginBottom: "12px",
    overflow: "hidden",
  },
  accent: {
    height: "4px",
    width: "100%",
    marginBottom: "14px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 14px",
    marginBottom: "4px",
  },
  invoice: {
    color: "#e86a2f",
    fontSize: "12px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px",
    fontWeight: 600,
  },
  customer: {
    color: "#aaa",
    fontSize: "11px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px",
    textAlign: "right",
    flex: 1,
    marginLeft: "8px",
  },
  itemName: {
    color: "#fff",
    fontSize: "16px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px",
    margin: "0 0 12px 0",
    padding: "0 14px",
    lineHeight: 1.3,
  },
  specs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "0 14px",
    marginBottom: "10px",
  },
  expandedSection: {
    borderTop: "1px solid #222",
    margin: "0 14px 10px",
    paddingTop: "10px",
  },
  expandedGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "8px",
  },
  spec: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  specLabel: {
    color: "#555",
    fontSize: "9px",
    letterSpacing: "1.5px",
    fontFamily: "'Oswald', sans-serif",
  },
  specValue: {
    color: "#ccc",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
  specHighlight: {
    color: "#fff",
    fontWeight: 600,
  },
  notes: {
    color: "#888",
    fontSize: "12px",
    margin: "8px 0 0 0",
    padding: "8px",
    background: "#141414",
    borderRadius: "6px",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.4,
  },
  expandBtn: {
    display: "block",
    width: "calc(100% - 28px)",
    margin: "0 14px 10px",
    padding: "8px",
    background: "#141414",
    border: "1px solid #222",
    borderRadius: "6px",
    fontSize: "10px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "2px",
    color: "#555",
    cursor: "pointer",
    textAlign: "center",
  },
  advanceBtn: {
    display: "block",
    width: "calc(100% - 28px)",
    margin: "0 14px 0",
    padding: "12px",
    background: "transparent",
    border: "1px solid",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "2px",
    cursor: "pointer",
    textAlign: "center",
    fontWeight: 600,
  },
  shippedBadge: {
    display: "block",
    width: "calc(100% - 28px)",
    margin: "0 14px",
    padding: "12px",
    background: "#0d2b18",
    border: "1px solid #22c55e",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: "2px",
    color: "#22c55e",
    textAlign: "center",
  },
  managerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    padding: "10px 14px 0",
  },
  editBtn: {
    background: "none",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#888",
    fontSize: "10px",
    letterSpacing: "1px",
    fontFamily: "'Oswald', sans-serif",
    cursor: "pointer",
    padding: "4px 10px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#333",
    fontSize: "10px",
    letterSpacing: "1px",
    fontFamily: "'Oswald', sans-serif",
    cursor: "pointer",
  },
  confirmText: {
    color: "#666",
    fontSize: "11px",
    fontFamily: "'Inter', sans-serif",
  },
  confirmYes: {
    background: "#7f1d1d",
    color: "#ff4444",
    border: "none",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontFamily: "'Oswald', sans-serif",
    cursor: "pointer",
  },
  confirmNo: {
    background: "#1a1a1a",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontFamily: "'Oswald', sans-serif",
    cursor: "pointer",
  },
};
