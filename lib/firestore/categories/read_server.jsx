import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export const getCategory = async ({ id }) => {
  const data = await getDoc(doc(db, `categories/${id}`));
  if (data.exists()) {
    return data.data();
  } else {
    return null;
  }
};

export const getCategories = async () => {
  const list = await getDocs(collection(db, "categories"));
  return list.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
};

export const getCategoryBySlug = async ({ slug }) => {
  if (!slug) return null;
  const list = await getDocs(
    query(collection(db, "categories"), where("slug", "==", slug))
  );
  if (list.docs.length > 0) {
    const snap = list.docs[0];
    return { id: snap.id, ...snap.data() };
  } else {
    return null;
  }
};

export const getCategoriesBySlug = async ({ slug }) => {
  if (!slug) return [];
  const list = await getDocs(
    query(collection(db, "categories"), where("slug", "==", slug))
  );
  return list.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
};
