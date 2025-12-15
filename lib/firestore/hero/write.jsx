import { db } from "@/lib/firebase";
import {
    collection,
    deleteDoc,
    doc,
    setDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";

// Upload helper (reuse functionality if possible, or duplicate for simplicity)
const uploadImage = async (file) => {
    if (!file) return null;
    const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
    });
    if (!response.ok) throw new Error("Upload failed");
    const blob = await response.json();
    return blob.url;
};

export const createHeroSlide = async ({ data, imageFile }) => {
    if (!imageFile) {
        throw new Error("Image is required");
    }

    const imageURL = await uploadImage(imageFile);
    const newId = doc(collection(db, `ids`)).id;

    await setDoc(doc(db, `hero_slides/${newId}`), {
        ...data,
        imageURL: imageURL,
        id: newId,
        rank: data.rank || 0, // Default rank
        timestampCreate: Timestamp.now(),
    });
};

export const updateHeroSlide = async ({ data, imageFile }) => {
    if (!data?.id) {
        throw new Error("ID is required");
    }

    let imageURL = data?.imageURL;
    if (imageFile) {
        imageURL = await uploadImage(imageFile);
    }

    await updateDoc(doc(db, `hero_slides/${data.id}`), {
        ...data,
        imageURL: imageURL,
        timestampUpdate: Timestamp.now(),
    });
};

export const deleteHeroSlide = async (id) => {
    if (!id) throw new Error("ID is required");
    await deleteDoc(doc(db, `hero_slides/${id}`));
};
