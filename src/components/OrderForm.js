// src/components/OrderForm.js
import React, { useState, useEffect } from "react";
import { useOrders } from "../hooks/useOrders";

const emptyForm = {
  invoice: "",
  po: "",
  customer: "",
  orderDate: "",
  pourDate: "",
  itemName: "",
  quantityUnit: "",
  quantityTotal: "",
  color: "",
  holeSize: "",
  liner: "",
  scupper: "",
  elastomericSealer: "No",
  notes: "",
};

export default function OrderForm({ onClose, editOrder }) {
  const { addOrder, updateOrder, deleteOrder, orders } = useOrders();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  // Cards to delete when decreasing total
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [selectedDeletes, setSelectedDeletes] = useState([]);

  const isEdit = !!editOrder;

  // Find all sibling orders (same invoice #)
  const siblingOrders = isEdit
    ? orders.filter((o) => o.invoice === editOrder.invoice)
    : [];

  useEffect(() => {
    if (editOrder) {
      const qParts = (editOrder.quantity || "").split(" OF ");
      setForm({
        invoice: editOrder.invoice || "",
        po: editOrder.po || "",
        customer: editOrder.customer || "",
        orderDate: editOrder.orderDate || "",
        pourDate: editOrder.pourDate || "",
        itemName: editOrder.itemName || "",
        quantityUnit: qParts[0] || "",
        quantityTotal: qParts[1] || "",
        color: editOrder.color || "",
        holeSize: editOrder.holeSize || "",
        liner: editOrder.liner || "",
        scupper: editOrder.scupper || "",
        elastomericSealer: editOrder.elastomericSealer || "No",
        notes: editOrder.notes || "",
      });
    }
  }, [editOrder]);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function toggleDelete(id) {
    setSelectedDeletes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleDeleteConfirm() {
    for (const id of selectedDeletes) {
      await deleteOrder(id);
    }
    setPendingDeletes([]);
    setSelectedDeletes([]);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = {
      invoice: form.invoice.trim(),
      po: form.po.trim(),
      customer: form.customer.trim().toUpperCase(),
      orderDate: form.orderDate,
      pourDate: form.pourDate,
      itemName: form.itemName.trim().toUpperCase(),
      quantityUnit: form.quantityUnit,
      quantityTotal: form.quantityTotal,
      color: form.color.trim(),
      holeSize: form.holeSize.trim(),
      liner: form.liner.trim(),
      scupper: form.scupper.trim(),
      elastomericSealer: form.elastomericSealer,
      notes: form.notes.trim(),
    };

    try {
      if (isEdit) {
        const toDelete = await updateOrder(editOrder.id, data, siblingOrders);
        if (toDelete && toDelete.length > 0) {
          // Prompt user to pick which cards to delete
          setPendingDeletes(toDelete);
          setSaving(false);
          return;
        }
      } else {
        await addOrder(data);
      }
      setSuccess(true);
      setForm(emptyForm);
      setTimeout(() => {
        setSuccess(false);
        if (isEdit) onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  // ── Delete confirmation screen ──
  if (pendingDeletes.length > 0) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2 style={styles.title}>REMOVE UNITS</h2>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <p style={styles.deletePrompt}>
            You reduced the total. Select which unit(s) to remove:
          </p>
          <div style={styles.deleteList}>
            {pendingDeletes.map((item) => {
              const selected = selectedDeletes.includes(item.id);
              return (
                <button
                  key={item.id}
                  style={{ ...styles.deleteChip, ...(selected ? styles.deleteChipSelected : {}) }}
                  onClick={() => toggleDelete(item.id)}
                >
                  {item.label} {selected ? "✓" : ""}
                </button>
              );
            })}
          </div>
          <button
            style={{ ...styles.submitBtn, ...(selectedDeletes.length === 0 ? styles.disabledBtn : {}) }}
            onClick={handleDeleteConfirm}
            disabled={selectedDeletes.length === 0}
          >
            REMOVE SELECTED
          </button>
          <button style={styles.skipBtn} onClick={onClose}>
            SKIP — KEEP ALL CARDS
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isEdit ? "EDIT ORDER" : "NEW ORDER"}</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {isEdit && siblingOrders.length > 1 && (
          <p style={styles.siblingNote}>
            ✦ {siblingOrders.length} units share this invoice. Field changes apply to all units.
          </p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <Row>
            <Field label="INVOICE #" required>
              <input style={styles.input} value={form.invoice} onChange={e => set("invoice", e.target.value)} placeholder="e.g. 1042" required />
            </Field>
            <Field label="PO #">
              <input style={styles.input} value={form.po} onChange={e => set("po", e.target.value)} placeholder="e.g. PO-884" />
            </Field>
          </Row>

          <Field label="CUSTOMER" required>
            <input style={styles.input} value={form.customer} onChange={e => set("customer", e.target.value)} placeholder="Company name" required />
          </Field>

          <Row>
            <Field label="ORDER DATE">
              <input style={styles.input} type="date" value={form.orderDate} onChange={e => set("orderDate", e.target.value)} />
            </Field>
            <Field label="POUR DATE">
              <input style={styles.input} type="date" value={form.pourDate} onChange={e => set("pourDate", e.target.value)} />
            </Field>
          </Row>

          <Field label="ITEM NAME" required>
            <input style={styles.input} value={form.itemName} onChange={e => set("itemName", e.target.value)} placeholder='e.g. CLASSIC MEDIUM, 60" OASIS OVAL' required />
          </Field>

          <Row>
            <Field label="UNIT #">
              <input style={{...styles.input, textAlign:"center"}} type="number" min="1" value={form.quantityUnit} onChange={e => set("quantityUnit", e.target.value)} placeholder="1" />
            </Field>
            <div style={styles.ofLabel}>OF</div>
            <Field label="TOTAL IN ORDER">
              <input style={{...styles.input, textAlign:"center"}} type="number" min="1" value={form.quantityTotal} onChange={e => set("quantityTotal", e.target.value)} placeholder="7" />
            </Field>
          </Row>

          <Row>
            <Field label="COLOR">
              <input style={styles.input} value={form.color} onChange={e => set("color", e.target.value)} placeholder="e.g. Onyx, Coal Gray" />
            </Field>
            <Field label="HOLE SIZE">
              <input style={styles.input} value={form.holeSize} onChange={e => set("holeSize", e.target.value)} placeholder='e.g. 1.5"' />
            </Field>
          </Row>

          <Row>
            <Field label="LINER">
              <input style={styles.input} value={form.liner} onChange={e => set("liner", e.target.value)} placeholder="e.g. 14 gallon" />
            </Field>
            <Field label="SCUPPER">
              <input style={styles.input} value={form.scupper} onChange={e => set("scupper", e.target.value)} placeholder='e.g. 1.5"' />
            </Field>
          </Row>

          <Field label="ELASTOMERIC SEALER">
            <select style={styles.input} value={form.elastomericSealer} onChange={e => set("elastomericSealer", e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>

          <Field label="NOTES">
            <textarea style={{...styles.input, minHeight:"64px", resize:"vertical"}} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions..." />
          </Field>

          <button style={{...styles.submitBtn, ...(success ? styles.successBtn : {})}} type="submit" disabled={saving}>
            {success ? "✓ SAVED" : saving ? "SAVING..." : isEdit ? "SAVE CHANGES" : "ADD TO BOARD"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>{children}</div>;
}

function Field({ label, children, required }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={styles.label}>{label}{required && <span style={{color:"#e86a2f"}}> *</span>}</label>
      {children}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    zIndex: 100, display: "flex", alignItems: "flex-end",
  },
  sheet: {
    background: "#1a1a1a", borderRadius: "20px 20px 0 0", width: "100%",
    maxHeight: "92vh", overflowY: "auto", padding: "24px 20px 40px",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "16px",
  },
  title: {
    color: "#fff", fontFamily: "'Oswald', sans-serif",
    fontSize: "20px", letterSpacing: "4px", margin: 0,
  },
  closeBtn: {
    background: "#2a2a2a", border: "none", color: "#aaa",
    borderRadius: "50%", width: "32px", height: "32px", fontSize: "14px", cursor: "pointer",
  },
  siblingNote: {
    color: "#e86a2f", fontSize: "11px", fontFamily: "'Oswald', sans-serif",
    letterSpacing: "1px", margin: "0 0 16px 0", lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: { color: "#666", fontSize: "10px", letterSpacing: "1.5px", fontFamily: "'Oswald', sans-serif" },
  input: {
    background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px",
    padding: "12px 14px", color: "#fff", fontSize: "15px", width: "100%",
    boxSizing: "border-box", fontFamily: "'Inter', sans-serif", outline: "none",
  },
  ofLabel: {
    color: "#555", fontSize: "12px", fontFamily: "'Oswald', sans-serif",
    paddingBottom: "12px", letterSpacing: "1px",
  },
  submitBtn: {
    background: "#e86a2f", color: "#fff", border: "none", borderRadius: "10px",
    padding: "18px", fontSize: "14px", fontFamily: "'Oswald', sans-serif",
    letterSpacing: "3px", cursor: "pointer", marginTop: "8px", transition: "background 0.3s",
  },
  successBtn: { background: "#2d8a4e" },
  disabledBtn: { background: "#333", cursor: "not-allowed" },
  deletePrompt: {
    color: "#aaa", fontSize: "13px", fontFamily: "'Inter', sans-serif",
    marginBottom: "20px", lineHeight: 1.5,
  },
  deleteList: {
    display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px",
  },
  deleteChip: {
    background: "#111", border: "1px solid #333", borderRadius: "8px",
    padding: "10px 16px", color: "#aaa", fontSize: "13px",
    fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", cursor: "pointer",
  },
  deleteChipSelected: {
    background: "#3d1010", border: "1px solid #ff4444", color: "#ff4444",
  },
  skipBtn: {
    display: "block", width: "100%", marginTop: "12px",
    background: "none", border: "none", color: "#444",
    fontSize: "11px", fontFamily: "'Oswald', sans-serif",
    letterSpacing: "2px", cursor: "pointer", textAlign: "center",
  },
};
