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
        quantity: orderData.quantityUnit
          ? `${orderData.quantityUnit} OF ${total}`
          : `1 OF 1`,
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

  async function updateOrder(orderId, orderData) {
    const ref = doc(db, "orders", orderId);
    await updateDoc(ref, { ...orderData });
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
