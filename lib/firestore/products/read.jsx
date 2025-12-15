"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import useSWRSubscription from "swr/subscription";

export function useProducts({ pageLimit, lastSnapDoc, categoryIds, brandId }) {
  const { data, error } = useSWRSubscription(
    ["products", pageLimit, lastSnapDoc, categoryIds, brandId],
    ([path, pageLimit, lastSnapDoc, categoryIds, brandId], { next }) => {
      const ref = collection(db, path);

      let constraints = [];

      if (categoryIds && categoryIds.length > 0) {
        // Firestore 'in' has a limit of 10
        const safeIds = categoryIds.slice(0, 10);
        constraints.push(where("categoryId", "in", safeIds));
      }

      if (brandId) {
        constraints.push(where("brandId", "==", brandId));
      }

      // Important: Add order by logic if needed, but filtering first is usually safer for compound query
      // However, Firestore requires orderBy to match inequality filters if used.
      // Here we just use equality.

      constraints.push(limit(pageLimit ?? 10));

      if (lastSnapDoc) {
        constraints.push(startAfter(lastSnapDoc));
      }

      let q = query(ref, ...constraints);

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

export function useProduct({ productId }) {
  const { data, error } = useSWRSubscription(
    ["products", productId],
    ([path, productId], { next }) => {
      const ref = doc(db, `${path}/${productId}`);

      const unsub = onSnapshot(
        ref,
        (snapshot) => next(null, snapshot.data()),
        (err) => next(err, null)
      );
      return () => unsub();
    }
  );

  return {
    data: data,
    error: error?.message,
    isLoading: data === undefined,
  };
}

export function useProductsByIds({ idsList }) {
  const { data, error } = useSWRSubscription(
    ["products", idsList],
    ([path, idsList], { next }) => {
      const ref = collection(db, path);

      let q = query(ref, where("id", "in", idsList));

      const unsub = onSnapshot(
        q,
        (snapshot) =>
          next(
            null,
            snapshot.docs.length === 0
              ? []
              : snapshot.docs.map((snap) => snap.data())
          ),
        (err) => next(err, null)
      );
      return () => unsub();
    }
  );

  return {
    data: data,
    error: error?.message,
    isLoading: data === undefined,
  };
}
