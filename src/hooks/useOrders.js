// src/hooks/useOrders.js
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

export const STAGES = ["orders", "prep", "curing", "paint", "shipping", "completed"];

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

  async function addOrder(orderData) {
    const total = parseInt(orderData.quantityTotal) || 1;
    if (total <= 1) {
      await addDoc(collection(db, "orders"), {
        ...orderData,
        quantity: `1 OF ${total}`,
        status: "orders",
        createdAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      for (let i = 1; i <= total; i++) {
        const ref = doc(collection(db, "orders"));
        batch.set(ref, {
          ...orderData,
          quantity: `${i} OF ${total}`,
          status: "orders",
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  // scope: "this" | "selected" | "all"
  // selectedIds: array of order ids (used when scope === "selected")
  async function updateOrder(orderId, orderData, siblingOrders, scope, selectedIds) {
    const newTotal = parseInt(orderData.quantityTotal) || 1;
    const sorted = [...(siblingOrders || [])].sort((a, b) => {
      const aU = parseInt((a.quantity || "").split(" OF ")[0]) || 0;
      const bU = parseInt((b.quantity || "").split(" OF ")[0]) || 0;
      return aU - bU;
    });
    const currentTotal = sorted.length;

    const baseData = { ...orderData };
    delete baseData.quantityUnit;
    delete baseData.quantityTotal;

    // Determine which orders to update based on scope
    let toUpdate = [];
    if (scope === "this") {
      toUpdate = sorted.filter((o) => o.id === orderId);
    } else if (scope === "selected") {
      toUpdate = sorted.filter((o) => selectedIds.includes(o.id));
    } else {
      // "all"
      toUpdate = sorted;
    }

    // Update selected orders
    const batch = writeBatch(db);
    for (const sibling of sorted) {
      const unitNum = parseInt((sibling.quantity || "").split(" OF ")[0]) || 1;
      const shouldUpdate = toUpdate.some((o) => o.id === sibling.id);
      const updatedFields = shouldUpdate
        ? { ...baseData, quantity: `${unitNum} OF ${newTotal}` }
        : { quantity: `${unitNum} OF ${newTotal}` }; // just update total label
      batch.update(doc(db, "orders", sibling.id), updatedFields);
    }
    await batch.commit();

    // If total increased and scope is "all" — add missing units
    if (scope === "all" && newTotal > currentTotal) {
      const addBatch = writeBatch(db);
      for (let i = currentTotal + 1; i <= newTotal; i++) {
        const ref = doc(collection(db, "orders"));
        addBatch.set(ref, {
          ...baseData,
          quantity: `${i} OF ${newTotal}`,
          status: "orders",
          createdAt: serverTimestamp(),
        });
      }
      await addBatch.commit();
      return null;
    }

    // If total decreased and scope is "all" — return candidates
    if (scope === "all" && newTotal < currentTotal) {
      const extras = sorted.slice(newTotal);
      return extras.map((o) => ({ id: o.id, label: o.quantity }));
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
      await updateDoc(ref, { status: STAGES[currentIndex - 1] });
    }
  }

  async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
  }

  return { orders, loading, addOrder, updateOrder, advanceOrder, regressOrder, deleteOrder };
}
