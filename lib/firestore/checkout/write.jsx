import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

export const createCheckoutAndGetURL = async ({ uid, products, address }) => {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products,
      address,
      userId: uid,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Checkout failed");
  }

  const data = await response.json();
  return data.url;
};

export const createCheckoutCODAndGetId = async ({ uid, products, address }) => {
  const checkoutId = `cod_${doc(collection(db, `ids`)).id}`;

  const ref = doc(db, `users/${uid}/checkout_sessions_cod/${checkoutId}`);

  let line_items = [];

  products.forEach((item) => {
    line_items.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: item?.product?.title ?? "",
          description: item?.product?.shortDescription ?? "",
          images: [
            item?.product?.featureImageURL ??
            `${process.env.NEXT_PUBLIC_DOMAIN}/logo.png`,
          ],
          metadata: {
            productId: item?.id,
          },
        },
        unit_amount: item?.product?.salePrice * 100,
      },
      quantity: item?.quantity ?? 1,
    });
  });

  // Add Shipping Line Item for COD
  line_items.push({
    price_data: {
      currency: "eur",
      product_data: {
        name: "Livraison Standard (7-10 jours)",
        description: "Expédition suivie",
      },
      unit_amount: 590, // 5.90 EUR
    },
    quantity: 1,
  });

  await setDoc(ref, {
    id: checkoutId,
    line_items: line_items,
    metadata: {
      checkoutId: checkoutId,
      uid: uid,
      address: JSON.stringify(address),
    },
    createdAt: Timestamp.now(),
  });

  return checkoutId;
};
