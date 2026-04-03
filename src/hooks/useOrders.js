// src/hooks/useOrders.js
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const STAGES = ["prep", "curing", "paint", "shipping", "completed"];

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Creates one order per unit if total > 1
  async function addOrder(orderData) {
    const total = parseInt(orderData.quantityTotal) || 1;
    if (total <= 1) {
      await addDoc(collection(db, "orders"), {
        ...orderData,
        quantity: `1 OF ${total}`,
        status: "prep",
        createdAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      for (let i = 1; i <= total; i++) {
        const ref = doc(collection(db, "orders"));
        batch.set(ref, {
          ...orderData,
          quantity: `${i} OF ${total}`,
          status: "prep",
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  // Updates all sibling orders with new field data.
  // If total increased: creates missing units.
  // If total decreased: returns list of candidates for deletion (user picks).
  async function updateOrder(orderId, orderData, siblingOrders) {
    const newTotal = parseInt(orderData.quantityTotal) || 1;

    // Sort siblings by their unit number
    const sorted = [...(siblingOrders || [])].sort((a, b) => {
      const aUnit = parseInt((a.quantity || "").split(" OF ")[0]) || 0;
      const bUnit = parseInt((b.quantity || "").split(" OF ")[0]) || 0;
      return aUnit - bUnit;
    });

    const currentTotal = sorted.length;

    // Build base data without quantity (we'll set per-unit)
    const baseData = { ...orderData };
    delete baseData.quantityUnit;
    delete baseData.quantityTotal;

    // Update all existing siblings with new field values + updated total
    const batch = writeBatch(db);
    for (const sibling of sorted) {
      const unitNum = parseInt((sibling.quantity || "").split(" OF ")[0]) || 1;
      batch.update(doc(db, "orders", sibling.id), {
        ...baseData,
        quantity: `${unitNum} OF ${newTotal}`,
      });
    }
    await batch.commit();

    // If total increased — add missing units
    if (newTotal > currentTotal) {
      const addBatch = writeBatch(db);
      for (let i = currentTotal + 1; i <= newTotal; i++) {
        const ref = doc(collection(db, "orders"));
        addBatch.set(ref, {
          ...baseData,
          quantity: `${i} OF ${newTotal}`,
          status: "prep",
          createdAt: serverTimestamp(),
        });
      }
      await addBatch.commit();
      return null; // no deletion needed
    }

    // If total decreased — return candidates for deletion
    if (newTotal < currentTotal) {
      const extras = sorted.slice(newTotal); // units beyond new total
      return extras.map((o) => ({
        id: o.id,
        label: o.quantity, // e.g. "5 OF 4" shown to user
      }));
    }

    return null;
  }

  async function advanceOrder(orderId, currentStatus) {
    const currentIndex = STAGES.indexOf(currentStatus);
    if (currentIndex < STAGES.length - 1) {
      const ref = doc(db, "orders", orderId);
      await updateDoc(ref, {
        status: STAGES[currentIndex + 1],
        [`${STAGES[currentIndex + 1]}At`]: serverTimestamp(),
      });
    }
  }

  async function regressOrder(orderId, currentStatus) {
    const currentIndex = STAGES.indexOf(currentStatus);
    if (currentIndex > 0) {
      const ref = doc(db, "orders", orderId);
      await updateDoc(ref, {
        status: STAGES[currentIndex - 1],
      });
    }
  }

  async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
  }

  return { orders, loading, addOrder, updateOrder, advanceOrder, regressOrder, deleteOrder };
}
