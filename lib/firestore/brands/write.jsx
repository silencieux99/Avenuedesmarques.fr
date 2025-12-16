import { db, storage } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const uploadImage = async (file) => {
  if (!file) return null;
  const response = await fetch(`/api/upload?filename=${file.name}`, {
    method: 'POST',
    body: file,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }
  const blob = await response.json();
  return blob.url;
};

export const createNewBrand = async ({ data, image }) => {
  if (!image) {
    throw new Error("Image is Required");
  }
  if (!data?.name) {
    throw new Error("Name is required");
  }

  const imageURL = await uploadImage(image);
  const newId = doc(collection(db, `ids`)).id;

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await setDoc(doc(db, `brands/${newId}`), {
    ...data,
    id: newId,
    slug: slug,
    imageURL: imageURL,
    timestampCreate: Timestamp.now(),
  });
};

export const updateBrand = async ({ data, image }) => {
  if (!data?.name) {
    throw new Error("Name is required");
  }
  if (!data?.id) {
    throw new Error("ID is required");
  }
  const id = data?.id;

  let imageURL = data?.imageURL;

  if (image) {
    imageURL = await uploadImage(image);
  }

  // Regenerate slug from name
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await updateDoc(doc(db, `brands/${id}`), {
    ...data,
    slug: slug,
    imageURL: imageURL,
    timestampUpdate: Timestamp.now(),
  });
};

export const deleteBrand = async ({ id }) => {
  if (!id) {
    throw new Error("ID is required");
  }
  await deleteDoc(doc(db, `brands/${id}`));
};
