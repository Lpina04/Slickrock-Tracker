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
} from "firebase/firestore";
import { db } from "../firebase";

const STAGES = ["prep", "curing", "paint", "shipping"];

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
    await addDoc(collection(db, "orders"), {
      ...orderData,
      status: "prep",
      createdAt: serverTimestamp(),
    });
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

  async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
  }

  return { orders, loading, addOrder, advanceOrder, deleteOrder };
}
