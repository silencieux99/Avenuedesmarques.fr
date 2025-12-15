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
  return list.docs.map((snap) => snap.data());
};

export const getCategoryBySlug = async ({ slug }) => {
  const list = await getDocs(
    query(collection(db, "categories"), where("slug", "==", slug))
  );
  if (list.docs.length > 0) {
    return list.docs[0].data();
  } else {
    return null;
  }
};
