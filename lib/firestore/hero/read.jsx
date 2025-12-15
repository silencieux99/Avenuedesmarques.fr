"use client";

import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import useSWRSubscription from "swr/subscription";

export function useHeroSlides() {
    const { data, error } = useSWRSubscription(
        ["hero_slides"],
        ([path], { next }) => {
            const ref = collection(db, path);
            const q = query(ref, orderBy('rank', 'asc')); // Order by rank by default

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

    return { data, error: error?.message, isLoading: data === undefined };
}
