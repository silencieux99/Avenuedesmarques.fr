"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/lib/firestore/orders/read";
import { CircularProgress } from "@nextui-org/react";

export default function Page() {
  const { user } = useAuth();

  const { data: orders, error, isLoading } = useOrders({ uid: user?.uid });

  if (isLoading) {
    return (
      <div className="flex justify-center py-48">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <>{error}</>;
  }

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 md:px-8 bg-background">
      <div className="max-w-[1000px] mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-widest">
            Mon Compte
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wide">
            Historique de vos commandes
          </p>
        </div>

        {(!orders || orders?.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900">Aucune commande pour le moment</h2>
              <p className="text-gray-500">
                Vous n'avez pas encore passé de commande. Explorez notre collection exclusive.
              </p>
            </div>
            <a href="/" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors">
              Commencer le shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.map((item, orderIndex) => {
              const totalAmount = item?.checkout?.line_items?.reduce(
                (prev, curr) => {
                  return (
                    prev + (curr?.price_data?.unit_amount / 100) * curr?.quantity
                  );
                },
                0
              );
              return (
                <div key={orderIndex} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="bg-gray-50/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-serif font-bold text-lg">
                        #{orderIndex + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Date</span>
                        <span className="text-sm font-medium">
                          {item?.timestampCreate?.toDate()?.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item?.status === 'paid' ? 'bg-green-100 text-green-700' :
                        item?.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {item?.status ?? "En attente"}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {item?.paymentMode}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wider block">Total</span>
                      <span className="text-lg font-bold font-serif text-accent">
                        {totalAmount.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 space-y-4">
                    {item?.checkout?.line_items?.map((product, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                          <img
                            className="h-full w-full object-cover"
                            src={product?.price_data?.product_data?.images?.[0]}
                            alt={product?.price_data?.product_data?.name}
                          />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-900 text-sm md:text-base">
                            {product?.price_data?.product_data?.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              Quantité: {product?.quantity}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {(product?.price_data?.unit_amount / 100).toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
