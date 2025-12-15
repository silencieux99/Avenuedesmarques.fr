"use client";

import { useState } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TrackOrderPage() {
    const [email, setEmail] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);
        setSearched(true);

        try {
            // Search in orders collection
            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef,
                where('customerEmail', '==', email.toLowerCase().trim())
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError('Aucune commande trouvée avec cet email.');
                setLoading(false);
                return;
            }

            // Find matching order number
            let foundOrder = null;
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Check if order number matches (generate same way as success page)
                if (data.orderNumber === orderNumber || data.id?.includes(orderNumber.split('-').pop()?.toLowerCase())) {
                    foundOrder = { id: doc.id, ...data };
                }
            });

            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                setError('Numéro de commande invalide ou non trouvé.');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError('Une erreur est survenue. Veuillez réessayer.');
        }

        setLoading(false);
    };

    const getStatusInfo = (status) => {
        const statuses = {
            pending: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50', icon: Clock, step: 1 },
            confirmed: { label: 'Confirmée', color: 'text-blue-600 bg-blue-50', icon: CheckCircle, step: 2 },
            processing: { label: 'En préparation', color: 'text-purple-600 bg-purple-50', icon: Package, step: 2 },
            shipped: { label: 'Expédiée', color: 'text-indigo-600 bg-indigo-50', icon: Truck, step: 3 },
            delivered: { label: 'Livrée', color: 'text-green-600 bg-green-50', icon: CheckCircle, step: 4 },
            cancelled: { label: 'Annulée', color: 'text-red-600 bg-red-50', icon: AlertCircle, step: 0 },
        };
        return statuses[status] || statuses.pending;
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <Header />

            <section className="pt-32 pb-20 px-4">
                <div className="max-w-2xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-6">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Où est ma commande ?
                        </h1>
                        <p className="text-gray-600">
                            Entrez votre email et numéro de commande pour suivre votre livraison.
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email utilisé lors de la commande
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numéro de commande
                                </label>
                                <input
                                    type="text"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                    placeholder="ADM-XXXXXX-XXXXXX"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Rechercher ma commande
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Error Message */}
                    {error && searched && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Order Found */}
                    {order && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            {/* Order Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Commande</p>
                                        <p className="font-mono font-bold text-lg">{order.orderNumber || order.id}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusInfo(order.status).color}`}>
                                        {getStatusInfo(order.status).label}
                                    </div>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="p-6 bg-gray-50">
                                <div className="flex items-center justify-between relative">
                                    {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => {
                                        const currentStep = getStatusInfo(order.status).step;
                                        const isActive = index < currentStep;
                                        const isCurrent = index === currentStep - 1;

                                        return (
                                            <div key={step} className="flex flex-col items-center relative z-10">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive || isCurrent ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
                                                    }`}>
                                                    {index === 0 && <Clock className="w-5 h-5" />}
                                                    {index === 1 && <Package className="w-5 h-5" />}
                                                    {index === 2 && <Truck className="w-5 h-5" />}
                                                    {index === 3 && <CheckCircle className="w-5 h-5" />}
                                                </div>
                                                <p className={`text-xs mt-2 ${isActive || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                                    {index === 0 && 'Reçue'}
                                                    {index === 1 && 'Préparation'}
                                                    {index === 2 && 'Expédiée'}
                                                    {index === 3 && 'Livrée'}
                                                </p>
                                            </div>
                                        );
                                    })}

                                    {/* Progress Line */}
                                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                                        <div
                                            className="h-full bg-black transition-all"
                                            style={{ width: `${Math.max(0, (getStatusInfo(order.status).step - 1) * 33.33)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="p-6">
                                <h3 className="font-medium text-gray-900 mb-4">Détails de la commande</h3>

                                <div className="space-y-4">
                                    {/* Products */}
                                    {order.line_items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                                {item.price_data?.product_data?.images?.[0] ? (
                                                    <img
                                                        src={item.price_data.product_data.images[0]}
                                                        alt={item.price_data.product_data.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.price_data?.product_data?.name || 'Produit'}</p>
                                                <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">
                                                {((item.price_data?.unit_amount / 100) * item.quantity).toFixed(2)} €
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="border-t border-gray-100 mt-6 pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{order.amountTotal?.toFixed(2) || '0.00'} €</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="mt-10 text-center">
                        <p className="text-gray-600 mb-4">Une question sur votre commande ?</p>
                        <a
                            href="mailto:contact@avenuedesmarques.fr"
                            className="inline-flex items-center gap-2 text-black font-medium hover:underline"
                        >
                            Contactez-nous
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
