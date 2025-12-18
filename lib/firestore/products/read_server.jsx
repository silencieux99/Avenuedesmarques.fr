import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export const getProduct = async ({ id }) => {
  const data = await getDoc(doc(db, `products/${id}`));
  if (data.exists()) {
    return data.data();
  } else {
    return null;
  }
};

export const getFeaturedProducts = async () => {
  const list = await getDocs(
    query(collection(db, "products"), where("isFeatured", "==", true))
  );
  return list.docs.map((snap) => snap.data());
};

export const getHeroProducts = async () => {
  const list = await getDocs(
    query(collection(db, "products"), where("showInHero", "==", true))
  );
  return list.docs.map((snap) => snap.data());
};

export const getProducts = async () => {
  const list = await getDocs(
    query(collection(db, "products"), orderBy("timestampCreate", "desc"))
  );
  return list.docs.map((snap) => snap.data());
};

export const getProductsByCategory = async ({ categoryId }) => {
  if (!categoryId) return [];
  const list = await getDocs(
    query(
      collection(db, "products"),
      where("categoryId", "==", categoryId)
    )
  );
  return list.docs.map((snap) => snap.data());
};

export const getProductsByCategoryIds = async ({ categoryIds }) => {
  if (!categoryIds || categoryIds.length === 0) return [];

  // Firestore "in" limit is 10
  const chunks = [];
  for (let i = 0; i < categoryIds.length; i += 10) {
    chunks.push(categoryIds.slice(i, i + 10));
  }

  const promises = chunks.map(async (chunk) => {
    const list = await getDocs(
      query(collection(db, "products"), where("categoryId", "in", chunk))
    );
    return list.docs.map((snap) => snap.data());
  });

  const results = await Promise.all(promises);
  return results.flat();
};
