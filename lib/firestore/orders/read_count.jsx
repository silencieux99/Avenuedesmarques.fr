"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  count,
  getAggregateFromServer,
  query,
  sum,
  where,
  Timestamp,
} from "firebase/firestore";
import useSWR from "swr";

const GLOBAL_CACHE = {};
let LAST_ERROR_TIMESTAMP = 0;
const ERROR_COOLDOWN_MS = 60000; // 1 minute cooldown after error

export const getOrdersCounts = async ({ date }) => {
  // Circuit breaker check
  if (Date.now() - LAST_ERROR_TIMESTAMP < ERROR_COOLDOWN_MS) {
    throw new Error("Cooling down after quota limit");
  }

  const ref = collection(db, `orders`);
  let q = query(ref);

  if (date) {
    const fromDate = new Date(date);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(date);
    toDate.setHours(24, 0, 0, 0);
    q = query(
      q,
      where("timestampCreate", ">=", Timestamp.fromDate(fromDate)),
      where("timestampCreate", "<=", Timestamp.fromDate(toDate))
    );
  }

  try {
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
  } catch (error) {
    console.error("Error in getOrdersCounts:", error);
    LAST_ERROR_TIMESTAMP = Date.now();
    throw error;
  }
};

export const getTotalOrdersCounts = async (dates) => {
  // Circuit breaker check
  if (Date.now() - LAST_ERROR_TIMESTAMP < ERROR_COOLDOWN_MS) {
    console.warn("Skipping total aggregation due to recent error (cooldown active)");
    return [];
  }

  const promises = dates.map(async (date) => {
    const dateKey = date.toISOString().split('T')[0];

    // Check in-memory cache
    if (GLOBAL_CACHE[dateKey]) {
      return GLOBAL_CACHE[dateKey];
    }

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const list = await getAggregateFromServer(
        query(
          collection(db, "orders"),
          where("timestampCreate", ">=", Timestamp.fromDate(startOfDay)),
          where("timestampCreate", "<=", Timestamp.fromDate(endOfDay))
        ),
        {
          totalOrders: count(),
          totalRevenue: sum("payment.amount"),
        }
      );

      const result = {
        date: date,
        data: list.data(),
      };

      // Store in cache
      GLOBAL_CACHE[dateKey] = result;

      return result;
    } catch (error) {
      console.error(`Error fetching stats for ${dateKey}:`, error);
      LAST_ERROR_TIMESTAMP = Date.now(); // Trip the circuit breaker
      // Return empty/safe object to allow other promises to possibly resolve or at least fail gracefully
      return { date: date, data: { totalOrders: 0, totalRevenue: 0 } };
    }
  });

  try {
    const list = await Promise.all(promises);
    return list;
  } catch (err) {
    console.error("Aggregation Promise.all failed completely", err);
    return [];
  }
};

export function useOrdersCounts() {
  const { data, error, isLoading } = useSWR(
    "ordrs_counts",
    (key) => getOrdersCounts({ date: null }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      shouldRetryOnError: false,
    }
  );
  if (error) {
    // console.log(error?.message);
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
      dedupingInterval: 60000 * 5,
      shouldRetryOnError: false,
    }
  );
  if (error) {
    // console.log(error?.message);
  }
  return { data, error, isLoading };
}
