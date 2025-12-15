import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

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

export const createNewProduct = async ({ data, featureImage, imageList }) => {
  if (!data?.title) {
    throw new Error("Title is required");
  }
  if (!featureImage) {
    throw new Error("Feature Image is required");
  }

  const featureImageURL = await uploadImage(featureImage);

  let imageURLList = [];

  for (let i = 0; i < imageList?.length; i++) {
    const image = imageList[i];
    const url = await uploadImage(image);
    if (url) imageURLList.push(url);
  }

  const newId = doc(collection(db, `ids`)).id;

  await setDoc(doc(db, `products/${newId}`), {
    ...data,
    featureImageURL: featureImageURL,
    imageList: imageURLList,
    id: newId,
    timestampCreate: Timestamp.now(),
  });
};

export const updateProduct = async ({ data, featureImage, imageList }) => {
  if (!data?.title) {
    throw new Error("Title is required");
  }
  if (!data?.id) {
    throw new Error("ID is required");
  }

  let featureImageURL = data?.featureImageURL ?? "";

  if (featureImage) {
    featureImageURL = await uploadImage(featureImage);
  }

  // Initialize with existing images
  let imageURLList = [...(data?.imageList ?? [])];

  // Append new uploaded images
  if (imageList?.length > 0) {
    for (let i = 0; i < imageList.length; i++) {
      const image = imageList[i];
      const url = await uploadImage(image);
      if (url) imageURLList.push(url);
    }
  }

  await setDoc(doc(db, `products/${data?.id}`), {
    ...data,
    featureImageURL: featureImageURL,
    imageList: imageURLList,
    timestampUpdate: Timestamp.now(),
  });
};

export const deleteProduct = async ({ id }) => {
  if (!id) {
    throw new Error("ID is required");
  }
  await deleteDoc(doc(db, `products/${id}`));
};

export const createProductFromAI = async ({ data, featureImageURL, imageListURLs }) => {
  if (!data?.title) {
    throw new Error("Title is required");
  }

  const newId = doc(collection(db, `ids`)).id;

  await setDoc(doc(db, `products/${newId}`), {
    ...data,
    featureImageURL: featureImageURL || "",
    imageList: imageListURLs || [],
    id: newId,
    timestampCreate: Timestamp.now(),
  });
};
