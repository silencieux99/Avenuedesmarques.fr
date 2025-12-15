"use client";

import { useOrdersCounts } from "@/lib/firestore/orders/read_count";
import { useProductCount } from "@/lib/firestore/products/count/read_client";
import { useUsersCount } from "@/lib/firestore/user/read_count";
import { Package, ShoppingBag, TrendingUp, Users } from "lucide-react";

export default function CountMeter() {
  const { data: totalProduct } = useProductCount();
  const { data: totalUsers } = useUsersCount();
  const { data: ordersCounts } = useOrdersCounts();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        icon={<Package className="text-blue-500" />}
        title={"Produits"}
        value={totalProduct ?? 0}
      />
      <Card
        icon={<ShoppingBag className="text-orange-500" />}
        title={"Commandes"}
        value={ordersCounts?.totalOrders ?? 0}
      />
      <Card
        icon={<TrendingUp className="text-green-500" />}
        title={"Revenus"}
        value={`${(ordersCounts?.totalRevenue ?? 0) / 100} €`}
      />
      <Card
        icon={<Users className="text-purple-500" />}
        title={"Clients"}
        value={totalUsers ?? 0}
      />
    </section>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-gray-50 rounded-lg">
          {icon}
        </div>
        {/* Sparkline or trend could go here */}
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl text-gray-900">{value}</h1>
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      </div>
    </div>
  );
}
