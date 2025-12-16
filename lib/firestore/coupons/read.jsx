"use client";

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";
import useSWRSubscription from "swr/subscription";

export function useCoupons() {
    const { data, error } = useSWRSubscription(
        ["coupons"],
        ([path], { next }) => {
            const ref = collection(db, path);
            const unsub = onSnapshot(
                ref,
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

export function useCoupon({ id }) {
    const { data, error } = useSWRSubscription(
        ["coupons", id],
        ([path, id], { next }) => {
            const ref = doc(db, `${path}/${id}`);
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
