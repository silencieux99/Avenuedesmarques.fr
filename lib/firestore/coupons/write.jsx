"use client";

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    deleteDoc,
    setDoc,
    Timestamp,
} from "firebase/firestore";

export const createNewCoupon = async ({ data }) => {
    if (!data?.code) {
        throw new Error("Le code est obligatoire");
    }

    const id = data?.code?.toUpperCase().trim();
    await setDoc(doc(db, "coupons", id), {
        ...data,
        id: id,
        code: id,
        timestampCreate: Timestamp.now(),
    });
};

export const updateCoupon = async ({ data }) => {
    if (!data?.id) {
        throw new Error("ID est obligatoire");
    }

    await setDoc(
        doc(db, "coupons", data?.id),
        {
            ...data,
            timestampUpdate: Timestamp.now(),
        },
        { merge: true }
    );
};

export const deleteCoupon = async ({ id }) => {
    if (!id) {
        throw new Error("ID est obligatoire");
    }
    await deleteDoc(doc(db, "coupons", id));
};
