"use client";

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutForm({ productList }) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [address, setAddress] = useState({
        email: user?.email || '',
        country: 'France',
    });

    const handleAddress = (key, value) => {
        setAddress({ ...address, [key]: value });
    };

    // Calculate totals
    const subTotal = productList?.reduce((prev, curr) => {
        return prev + curr?.quantity * curr?.product?.salePrice;
    }, 0) || 0;

    const shippingCost = 5.90;
    const totalPrice = subTotal + shippingCost;

    const schengenCountries = [
        "France", "Allemagne", "Autriche", "Belgique", "Croatie", "Danemark", "Espagne", "Estonie",
        "Finlande", "Grèce", "Hongrie", "Islande", "Italie", "Lettonie", "Liechtenstein", "Lituanie",
        "Luxembourg", "Malte", "Norvège", "Pays-Bas", "Pologne", "Portugal", "République Tchèque",
        "Slovaquie", "Slovénie", "Suède", "Suisse"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        // Validation
        if (!address.email) {
            toast.error("Veuillez renseigner votre email");
            return;
        }
        if (!address.fullName || !address.addressLine1 || !address.city || !address.pincode || !address.country) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout-success`,
                    receipt_email: address.email,
                    shipping: {
                        name: address.fullName,
                        address: {
                            line1: address.addressLine1,
                            line2: address.addressLine2 || '',
                            city: address.city,
                            postal_code: address.pincode,
                            country: address.country === 'France' ? 'FR' : 'FR',
                        },
                    },
                },
            });

            if (error) {
                toast.error(error.message);
                console.error('Payment error:', error);
            }
        } catch (err) {
            toast.error('Une erreur est survenue lors du paiement');
            console.error('Submit error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <section className="flex flex-col-reverse lg:flex-row gap-8 max-w-[1200px] mx-auto py-6 px-4 md:px-6">
                {/* Left Column: Form */}
                <section className="flex-1 flex flex-col gap-8">
                    {/* Contact & Shipping */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Contact</h2>
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={address.email}
                            onChange={(e) => handleAddress("email", e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-500"
                        />

                        <div className="pt-4">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Adresse de livraison</h2>
                            <div className="space-y-3">
                                <select
                                    value={address.country}
                                    onChange={(e) => handleAddress("country", e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white cursor-pointer"
                                >
                                    <option value="" disabled>Pays / Région</option>
                                    {schengenCountries.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    placeholder="Nom complet"
                                    value={address.fullName || ''}
                                    onChange={(e) => handleAddress("fullName", e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                />

                                <input
                                    type="text"
                                    placeholder="Adresse"
                                    value={address.addressLine1 || ''}
                                    onChange={(e) => handleAddress("addressLine1", e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                />

                                <input
                                    type="text"
                                    placeholder="Appartement, suite, etc. (optionnel)"
                                    value={address.addressLine2 || ''}
                                    onChange={(e) => handleAddress("addressLine2", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                />

                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Code postal"
                                        value={address.pincode || ''}
                                        onChange={(e) => handleAddress("pincode", e.target.value)}
                                        required
                                        className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Ville"
                                        value={address.city || ''}
                                        onChange={(e) => handleAddress("city", e.target.value)}
                                        required
                                        className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                    />
                                </div>

                                <input
                                    type="tel"
                                    placeholder="Téléphone (optionnel)"
                                    value={address.phone || ''}
                                    onChange={(e) => handleAddress("phone", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500"
                                />
                            </div>

                            {/* Promo Code */}
                            <div className="pt-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Code promo</h2>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Entrez votre code promo"
                                        value={address.promoCode || ''}
                                        onChange={(e) => handleAddress("promoCode", e.target.value.toUpperCase())}
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 font-mono"
                                    />
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Appliquer
                                    </button>
                                </div>
                            </div>

                            {/* Customer Note */}
                            <div className="pt-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Note de commande (optionnel)</h2>
                                <textarea
                                    placeholder="Instructions spéciales pour la livraison, demandes particulières..."
                                    value={address.customerNote || ''}
                                    onChange={(e) => handleAddress("customerNote", e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 resize-none"
                                />
                            </div>

                            <div className="pt-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Paiement</h2>
                                <div className="border border-gray-300 rounded-lg p-4">
                                    <PaymentElement />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                isDisabled={!stripe || isLoading}
                                className="w-full py-7 bg-black text-white rounded-lg text-sm font-bold shadow hover:bg-gray-800 transition-all mt-4"
                            >
                                {isLoading ? 'Traitement...' : `Payer ${totalPrice.toFixed(2)} €`}
                            </Button>

                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    Paiement 100% sécurisé • Powered by Stripe
                                </p>
                            </div>
                        </div>
                </section>

                {/* Right Column: Order Summary */}
                <aside className="lg:w-[400px] bg-gray-50 p-6 rounded-lg h-fit lg:sticky lg:top-24">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h2>

                    <div className="space-y-4">
                        {productList?.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                    <img
                                        src={item.product.featureImageURL}
                                        alt={item.product.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.quantity}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">{item.product.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {(item.product.salePrice * item.quantity).toFixed(2)} €
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sous-total</span>
                            <span className="font-medium">{subTotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Livraison</span>
                            <span className="font-medium">{shippingCost.toFixed(2)} €</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>
                    </div>
                </aside>
            </section>
        </form>
    );
}
