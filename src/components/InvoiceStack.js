// src/components/InvoiceStack.js
import React, { useState } from "react";
import { useOrders } from "../hooks/useOrders";
import { useAuth } from "../contexts/AuthContext";
import OrderForm from "./OrderForm";

const STAGE_CONFIG = {
  orders:    { nextLabel: "→ SEND TO PREP",    prevLabel: null,               color: "#6366f1" },
  prep:      { nextLabel: "→ SENT TO CURE",    prevLabel: "← BACK TO ORDERS",color: "#3b82f6" },
  curing:    { nextLabel: "→ READY TO PAINT",  prevLabel: "← BACK TO PREP",  color: "#a855f7" },
  paint:     { nextLabel: "→ DONE PAINTING",   prevLabel: "← BACK TO CURE",  color: "#f59e0b" },
  shipping:  { nextLabel: "→ MARK SHIPPED",    prevLabel: "← BACK TO PAINT", color: "#22c55e" },
  completed: { nextLabel: null,                prevLabel: "← BACK TO SHIP",  color: "#64748b" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

// ── Single expanded unit row ──
function UnitRow({ order, allOrders, stageColor }) {
  const { advanceOrder, regressOrder, deleteOrder } = useOrders();
  const { currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [regressing, setRegressing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stage = STAGE_CONFIG[order.status] || STAGE_CONFIG.prep;

  async function handleAdvance() { setAdvancing(true); await advanceOrder(order.id, order.status); setAdvancing(false); }
  async function handleRegress() { setRegressing(true); await regressOrder(order.id, order.status); setRegressing(false); }

  return (
    <>
      <div style={styles.unitRow}>
        {/* Unit header — always visible */}
        <div style={styles.unitHeader} onClick={() => setExpanded(e => !e)}>
          <div style={{ ...styles.unitDot, background: stageColor }} />
          <span style={styles.unitQty}>{order.quantity}</span>
          {order.pourDate && (
            <span style={styles.unitPourDate}>Pour: {formatDate(order.pourDate)}</span>
          )}
          <span style={styles.unitChevron}>{expanded ? "▲" : "▼"}</span>
        </div>

        {/* Expanded unit details */}
        {expanded && (
          <div style={styles.unitDetails}>
            <div style={styles.unitSpecs}>
              <Spec label="COLOR" value={order.color || "—"} highlight />
              <Spec label="HOLE" value={order.holeSize || "—"} />
              <Spec label="LINER" value={order.liner || "—"} />
              <Spec label="SCUPPER" value={order.scupper || "—"} />
              <Spec label="SEALER" value={order.elastomericSealer || "No"} highlight={order.elastomericSealer === "Yes"} />
              <Spec label="ORDER DATE" value={formatDate(order.orderDate)} />
            </div>
            {order.notes && <p style={styles.notes}>📝 {order.notes}</p>}

            {/* Move buttons — logged in only */}
            {currentUser && stage.nextLabel && (
              <button style={{ ...styles.advanceBtn, borderColor: stageColor, color: stageColor }} onClick={handleAdvance} disabled={advancing}>
                {advancing ? "MOVING..." : stage.nextLabel}
              </button>
            )}
            {order.status === "completed" && (
              <div style={styles.completedBadge}>✓ COMPLETED</div>
            )}
            {currentUser && stage.prevLabel && (
              <button style={styles.regressBtn} onClick={handleRegress} disabled={regressing}>
                {regressing ? "MOVING..." : stage.prevLabel}
              </button>
            )}

            {/* Manager actions */}
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
        )}
      </div>

      {showEdit && (
        <OrderForm editOrder={order} allOrders={allOrders} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}

// ── Invoice stack (groups units by invoice) ──
export default function InvoiceStack({ invoice, units, allOrders }) {
  const [expanded, setExpanded] = useState(false);
  const stageConfig = STAGE_CONFIG[units[0]?.status] || STAGE_CONFIG.prep;
  const stageColor = stageConfig.color;

  // Sort units by unit number
  const sorted = [...units].sort((a, b) => {
    const aU = parseInt((a.quantity || "").split(" OF ")[0]) || 0;
    const bU = parseInt((b.quantity || "").split(" OF ")[0]) || 0;
    return aU - bU;
  });

  const firstUnit = sorted[0];
  const total = (firstUnit?.quantity || "").split(" OF ")[1] || units.length;

  return (
    <div style={styles.stack}>
      {/* Stack header — always visible */}
      <div style={{ ...styles.stackHeader, borderLeftColor: stageColor }} onClick={() => setExpanded(e => !e)}>
        <div style={styles.stackLeft}>
          <div style={styles.stackInvoice}>
            <span style={{ ...styles.invoiceNum, color: stageColor }}>#{invoice}</span>
            {firstUnit?.po && <span style={styles.poNum}>PO: {firstUnit.po}</span>}
          </div>
          <p style={styles.stackCustomer}>{firstUnit?.customer}</p>
          <p style={styles.stackItem}>{firstUnit?.itemName}</p>
        </div>
        <div style={styles.stackRight}>
          <div style={{ ...styles.unitCount, borderColor: stageColor, color: stageColor }}>
            {units.length}/{total}
          </div>
          <span style={styles.chevron}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Collapsed slivers */}
      {!expanded && sorted.length > 1 && (
        <div style={styles.slivers}>
          {sorted.map((unit, i) => (
            <div
              key={unit.id}
              style={{
                ...styles.sliver,
                marginLeft: `${(i + 1) * 6}px`,
                zIndex: sorted.length - i,
                opacity: 1 - i * 0.15,
              }}
              onClick={() => setExpanded(true)}
            >
              <span style={styles.sliverQty}>{unit.quantity}</span>
              {unit.pourDate && (
                <span style={styles.sliverDate}>Pour: {formatDate(unit.pourDate)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded unit rows */}
      {expanded && (
        <div style={styles.unitList}>
          {sorted.map((unit) => (
            <UnitRow key={unit.id} order={unit} allOrders={allOrders} stageColor={stageColor} />
          ))}
        </div>
      )}
    </div>
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
  stack: {
    background: "#1c1c1c", border: "1px solid #2a2a2a",
    borderRadius: "12px", marginBottom: "14px", overflow: "hidden",
  },
  stackHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "14px", borderLeft: "4px solid", cursor: "pointer",
    background: "#1c1c1c",
  },
  stackLeft: { flex: 1 },
  stackInvoice: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" },
  invoiceNum: { fontFamily: "'Oswald', sans-serif", fontSize: "14px", letterSpacing: "1px", fontWeight: 600 },
  poNum: { color: "#555", fontSize: "10px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" },
  stackCustomer: { color: "#888", fontSize: "11px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", margin: "0 0 2px 0" },
  stackItem: { color: "#fff", fontSize: "15px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", margin: 0 },
  stackRight: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", marginLeft: "12px" },
  unitCount: {
    border: "1px solid", borderRadius: "20px", padding: "2px 10px",
    fontSize: "12px", fontFamily: "'Oswald', sans-serif", fontWeight: 600,
  },
  chevron: { color: "#444", fontSize: "10px" },
  slivers: { display: "flex", flexDirection: "column", gap: "1px", padding: "0 8px 8px" },
  sliver: {
    background: "#141414", border: "1px solid #222", borderRadius: "6px",
    padding: "7px 12px", display: "flex", justifyContent: "space-between",
    alignItems: "center", cursor: "pointer",
  },
  sliverQty: { color: "#666", fontSize: "11px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" },
  sliverDate: { color: "#444", fontSize: "10px", fontFamily: "'Inter', sans-serif" },
  unitList: { borderTop: "1px solid #222" },
  unitRow: { borderBottom: "1px solid #1a1a1a" },
  unitHeader: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "11px 14px", cursor: "pointer", background: "#161616",
  },
  unitDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  unitQty: { color: "#ccc", fontSize: "13px", fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", flex: 1 },
  unitPourDate: { color: "#555", fontSize: "11px", fontFamily: "'Inter', sans-serif" },
  unitChevron: { color: "#444", fontSize: "10px" },
  unitDetails: { padding: "12px 14px", background: "#111" },
  unitSpecs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" },
  spec: { display: "flex", flexDirection: "column", gap: "2px" },
  specLabel: { color: "#555", fontSize: "9px", letterSpacing: "1.5px", fontFamily: "'Oswald', sans-serif" },
  specValue: { color: "#ccc", fontSize: "13px", fontFamily: "'Inter', sans-serif" },
  specHighlight: { color: "#fff", fontWeight: 600 },
  notes: { color: "#888", fontSize: "12px", margin: "0 0 10px 0", padding: "8px", background: "#0d0d0d", borderRadius: "6px", fontFamily: "'Inter', sans-serif", lineHeight: 1.4 },
  advanceBtn: {
    display: "block", width: "100%", marginBottom: "8px", padding: "11px",
    background: "transparent", border: "1px solid", borderRadius: "8px",
    fontSize: "12px", fontFamily: "'Oswald', sans-serif", letterSpacing: "2px",
    cursor: "pointer", textAlign: "center", fontWeight: 600,
  },
  regressBtn: {
    display: "block", width: "100%", marginTop: "6px", padding: "9px",
    background: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px",
    fontSize: "11px", fontFamily: "'Oswald', sans-serif", letterSpacing: "2px",
    cursor: "pointer", textAlign: "center", color: "#444",
  },
  completedBadge: {
    display: "block", width: "100%", padding: "11px", marginBottom: "8px",
    background: "#1a1f2e", border: "1px solid #64748b", borderRadius: "8px",
    fontSize: "12px", fontFamily: "'Oswald', sans-serif", letterSpacing: "2px",
    color: "#64748b", textAlign: "center",
  },
  managerRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", paddingTop: "10px" },
  editBtn: { background: "none", border: "1px solid #333", borderRadius: "4px", color: "#888", fontSize: "10px", letterSpacing: "1px", fontFamily: "'Oswald', sans-serif", cursor: "pointer", padding: "4px 10px" },
  deleteBtn: { background: "none", border: "none", color: "#333", fontSize: "10px", letterSpacing: "1px", fontFamily: "'Oswald', sans-serif", cursor: "pointer" },
  confirmText: { color: "#666", fontSize: "11px", fontFamily: "'Inter', sans-serif" },
  confirmYes: { background: "#7f1d1d", color: "#ff4444", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontFamily: "'Oswald', sans-serif", cursor: "pointer" },
  confirmNo: { background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontFamily: "'Oswald', sans-serif", cursor: "pointer" },
};
