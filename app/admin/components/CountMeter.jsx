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
        icon={<Package className="text-white" />}
        title={"Produits"}
        value={totalProduct ?? 0}
        color="bg-blue-500"
      />
      <Card
        icon={<ShoppingBag className="text-white" />}
        title={"Commandes"}
        value={ordersCounts?.totalOrders ?? 0}
        color="bg-orange-500"
      />
      <Card
        icon={<TrendingUp className="text-white" />}
        title={"Revenus"}
        value={`${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((ordersCounts?.totalRevenue ?? 0) / 100)}`}
        color="bg-green-500"
      />
      <Card
        icon={<Users className="text-white" />}
        title={"Clients"}
        value={totalUsers ?? 0}
        color="bg-purple-500"
      />
    </section>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-3 opacity-10 ${color} rounded-bl-xl`}>
        {/* Background decoration */}
      </div>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${color} shadow-lg shadow-${color}/30 transform transition-transform hover:scale-105`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1 z-10">
        <h1 className="font-bold text-2xl text-gray-900">{value}</h1>
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      </div>
    </div>
  );
}
