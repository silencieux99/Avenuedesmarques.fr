"use client";

import { db } from "@/lib/firebase";
import {
  average,
  collection,
  count,
  getAggregateFromServer,
  getCountFromServer,
} from "firebase/firestore";
import useSWR from "swr";

import { checkCircuitBreaker, tripCircuitBreaker } from "@/lib/circuit_breaker";

export const getProductsCount = async () => {
  try {
    checkCircuitBreaker();
    const ref = collection(db, `products`);
    const data = await getCountFromServer(ref);
    return data.data().count;
  } catch (error) {
    tripCircuitBreaker(error);
    throw error;
  }
};

export function useProductCount() {
  const { data, error, isLoading } = useSWR(
    "products_count",
    (key) => getProductsCount(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      shouldRetryOnError: false,
    }
  );
  if (error) {
    console.log(error?.message);
  }
  return { data, error, isLoading };
}
