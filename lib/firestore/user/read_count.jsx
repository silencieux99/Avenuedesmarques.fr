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

export const getUsersCount = async () => {
  try {
    checkCircuitBreaker();
    const ref = collection(db, `users`);
    const data = await getCountFromServer(ref);
    return data.data().count;
  } catch (error) {
    tripCircuitBreaker(error);
    throw error;
  }
};

export function useUsersCount() {
  const { data, error, isLoading } = useSWR(
    "users_count",
    (key) => getUsersCount(),
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
