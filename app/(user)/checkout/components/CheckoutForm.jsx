"use client";

import { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
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
    const [email, setEmail] = useState('');

    // Calculate totals
    const subTotal = productList?.reduce((prev, curr) => {
        return prev + curr?.quantity * curr?.product?.salePrice;
    }, 0) || 0;

    const shippingCost = 5.90;
    const totalPrice = subTotal + shippingCost;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        if (!email && !user) {
            toast.error("Veuillez renseigner votre email");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout-success`,
                    receipt_email: email || user?.email,
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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pb-20">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">

                {/* Email for guests */}
                {!user && (
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="votre@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Pour recevoir la confirmation de commande</p>
                    </div>
                )}

                {/* Shipping Address */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse de livraison</h3>
                    <AddressElement
                        options={{
                            mode: 'shipping',
                            allowedCountries: ['FR', 'BE', 'CH', 'DE', 'ES', 'IT', 'LU', 'NL', 'PT'],
                            defaultValues: {
                                address: {
                                    country: 'FR',
                                },
                            },
                        }}
                    />
                </div>

                {/* Payment Details */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de paiement</h3>
                    <PaymentElement />
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>

                    <div className="space-y-3">
                        {productList?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {item.product.title} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                    {(item.product.salePrice * item.quantity).toFixed(2)} €
                                </span>
                            </div>
                        ))}

                        <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                            <span className="text-gray-600">Sous-total</span>
                            <span className="font-medium">{subTotal.toFixed(2)} €</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Livraison</span>
                            <span className="font-medium">{shippingCost.toFixed(2)} €</span>
                        </div>

                        <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                            <span>Total</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    isLoading={isLoading}
                    isDisabled={!stripe || isLoading}
                    className="w-full py-7 bg-black text-white rounded-lg text-sm font-bold shadow hover:bg-gray-800 transition-all"
                >
                    {isLoading ? 'Traitement...' : `Payer ${totalPrice.toFixed(2)} €`}
                </Button>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Paiement sécurisé</span>
                    </div>
                    <span>•</span>
                    <span>Powered by Stripe</span>
                </div>
            </div>
        </form>
    );
}
