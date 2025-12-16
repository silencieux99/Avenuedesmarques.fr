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
import { checkCircuitBreaker, tripCircuitBreaker } from "@/lib/circuit_breaker";

export const getOrdersCounts = async ({ date }) => {
  try {
    checkCircuitBreaker();
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
    tripCircuitBreaker(error);
    throw error;
  }
};

export const getTotalOrdersCounts = async (dates) => {
  try {
    checkCircuitBreaker();
  } catch (error) {
    console.warn("Skipping total aggregation due to circuit breaker");
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
      tripCircuitBreaker(error);
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
      dedupingInterval: 300000, // 5 minutes
      shouldRetryOnError: false, // Do not retry on error if we are circuit breaking
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
      dedupingInterval: 3600000, // 1 hour for historical chart data
      shouldRetryOnError: false,
    }
  );
  if (error) {
    // console.log(error?.message);
  }
  return { data, error, isLoading };
}
