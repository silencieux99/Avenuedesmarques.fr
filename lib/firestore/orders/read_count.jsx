"use client";

import { db } from "@/lib/firebase";
import {
  average,
  collection,
  count,
  getAggregateFromServer,
  getCountFromServer,
  query,
  sum,
  where,
} from "firebase/firestore";
import useSWR from "swr";

export const getOrdersCounts = async ({ date }) => {
  const ref = collection(db, `orders`);
  let q = query(ref);

  if (date) {
    const fromDate = new Date(date);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(date);
    toDate.setHours(24, 0, 0, 0);
    q = query(
      q,
      where("timestampCreate", ">=", fromDate),
      where("timestampCreate", "<=", toDate)
    );
  }

  const data = await getAggregateFromServer(q, {
    totalRevenue: sum("payment.amount"),
    totalOrders: count(),
  });
  if (date) {
    return {
      date: `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
      data: data.data(),
    };
  }
  return data.data();
};

const getTotalOrdersCounts = async (dates) => {
  let promisesList = [];
  for (let i = 0; i < dates?.length; i++) {
    const date = dates[i];
    promisesList.push(getOrdersCounts({ date: date }));
  }
  const list = await Promise.all(promisesList);
  return list;
};

export function useOrdersCounts() {
  const { data, error, isLoading } = useSWR(
    "ordrs_counts",
    (key) => getOrdersCounts({ date: null }),
    {
      revalidateOnFocus: false, // Don't fetch on window focus
      revalidateOnReconnect: false, // Don't fetch on reconnect
      dedupingInterval: 60000, // Cache for 1 minute
      shouldRetryOnError: false, // Don't retry immediately on error (saves 429 loops)
    }
  );
  if (error) {
    console.log(error?.message);
  }
  return { data, error, isLoading };
}

export function useOrdersCountsByTotalDays({ dates }) {
  const { data, error, isLoading } = useSWR(
    ["orders_count", dates],
    ([key, dates]) =>
      getTotalOrdersCounts(dates?.sort((a, b) => a?.getTime() - b?.getTime())),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 * 5, // Cache for 5 minutes since historical data doesn't change fast
      shouldRetryOnError: false,
    }
  );
  if (error) {
    console.log(error?.message);
  }
  return { data, error, isLoading };
}
