"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import useSWRSubscription from "swr/subscription";

export function useOrder({ id }) {
  const { data, error } = useSWRSubscription(
    ["orders", id],
    ([path, id], { next }) => {
      const ref = doc(db, `orders/${id}`);
      const unsub = onSnapshot(
        ref,
        (snapshot) => next(null, snapshot.data()),
        (err) => next(err, null)
      );
      return () => unsub();
    }
  );

  if (error) {
    console.log(error?.message);
  }

  return { data, error: error?.message, isLoading: data === undefined };
}

export function useOrders({ uid }) {
  const { data, error } = useSWRSubscription(
    ["orders", uid],
    ([path, uid], { next }) => {
      const ref = query(
        collection(db, path),
        where("uid", "==", uid),
        orderBy("timestampCreate", "desc")
      );
      const unsub = onSnapshot(
        ref,
        (snapshot) =>
          next(
            null,
            snapshot.docs.length === 0
              ? null
              : snapshot.docs.map((snap) => snap.data())
          ),
        (err) => next(err, null)
      );
      return () => unsub();
    }
  );

  if (error) {
    console.log(error?.message);
  }

  return { data, error: error?.message, isLoading: data === undefined };
}

export function useAllOrders({ pageLimit, lastSnapDoc }) {
  const { data, error } = useSWRSubscription(
    ["orders", pageLimit, lastSnapDoc],
    ([path, pageLimit, lastSnapDoc], { next }) => {
      const ref = collection(db, path);
      let q = query(
        ref,
        limit(pageLimit ?? 10),
        orderBy("timestampCreate", "desc")
      );

      if (lastSnapDoc) {
        q = query(q, startAfter(lastSnapDoc));
      }

      const unsub = onSnapshot(
        q,
        (snapshot) =>
          next(null, {
            list:
              snapshot.docs.length === 0
                ? null
                : snapshot.docs.map((snap) => snap.data()),
            lastSnapDoc:
              snapshot.docs.length === 0
                ? null
                : snapshot.docs[snapshot.docs.length - 1],
          }),
        (err) => next(err, null)
      );
      return () => unsub();
    }
  );

  return {
    data: data?.list,
    lastSnapDoc: data?.lastSnapDoc,
    error: error?.message,
    isLoading: data === undefined,
  };
}
export const searchOrders = async (queryText) => {
  if (!queryText) return [];
  const qText = queryText.trim();
  const ref = collection(db, "orders");

  // Try multiple strategies
  // 1. Exact ID match
  const docRef = doc(db, "orders", qText);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return [docSnap.data()];
    }
  } catch (e) { }

  // 2. Order Number match
  const qOrderNum = query(ref, where("orderNumber", "==", qText));
  const snapOrderNum = await getDocs(qOrderNum);
  if (!snapOrderNum.empty) {
    return snapOrderNum.docs.map((d) => d.data());
  }

  // 3. Email match (case insensitive if possible, but Firestore is exact. We'll try exact lower/original)
  // Trying lowercase
  const qEmail = query(ref, where("customerEmail", "==", qText.toLowerCase()));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    return snapEmail.docs.map((d) => d.data());
  }

  return [];
};
