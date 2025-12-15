"use client";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button } from '@nextui-org/react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckoutWrapper({ productList }) {
    const [clientSecret, setClientSecret] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [step, setStep] = useState('form'); // 'form' or 'payment'
    const [address, setAddress] = useState({});
    const [loading, setLoading] = useState(false);

    const handleProceedToPayment = async (addressData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productList,
                    address: addressData,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setClientSecret(data.clientSecret);
            setOrderNumber(data.orderNumber);
            setAddress(addressData);
            setStep('payment');
        } catch (err) {
            console.error('Error creating payment intent:', err);
            toast.error(err.message || 'Erreur lors de la création du paiement');
        } finally {
            setLoading(false);
        }
    };

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#000000',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'Montserrat, system-ui, sans-serif',
            borderRadius: '8px',
        },
        rules: {
            '.Input': { border: '1px solid #e5e7eb', padding: '12px' },
            '.Input:focus': { border: '1px solid #000000' },
        },
    };

    if (step === 'form') {
        return (
            <AddressForm
                productList={productList}
                onSubmit={handleProceedToPayment}
                loading={loading}
            />
        );
    }

    return (
        <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
            <PaymentForm
                productList={productList}
                address={address}
                orderNumber={orderNumber}
                onBack={() => setStep('form')}
            />
        </Elements>
    );
}

// Address Form Component
function AddressForm({ productList, onSubmit, loading }) {
    const { user } = useAuth();
    const [address, setAddress] = useState({
        email: user?.email || '',
        country: 'France',
    });

    const handleAddress = (key, value) => {
        setAddress({ ...address, [key]: value });
    };

    const subTotal = productList?.reduce((prev, curr) => prev + curr?.quantity * curr?.product?.salePrice, 0) || 0;
    const shippingCost = 5.90;
    const totalPrice = subTotal + shippingCost;

    const schengenCountries = [
        "France", "Allemagne", "Autriche", "Belgique", "Croatie", "Danemark", "Espagne", "Estonie",
        "Finlande", "Grèce", "Hongrie", "Islande", "Italie", "Lettonie", "Liechtenstein", "Lituanie",
        "Luxembourg", "Malte", "Norvège", "Pays-Bas", "Pologne", "Portugal", "République Tchèque",
        "Slovaquie", "Slovénie", "Suède", "Suisse"
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!address.email) return toast.error("Veuillez renseigner votre email");
        if (!address.fullName || !address.addressLine1 || !address.city || !address.pincode) {
            return toast.error("Veuillez remplir tous les champs obligatoires");
        }
        onSubmit({ ...address, shippingCost });
    };

    return (
        <form onSubmit={handleSubmit}>
            <section className="flex flex-col-reverse lg:flex-row gap-8 max-w-[1200px] mx-auto py-6 px-4 md:px-6">
                <section className="flex-1 flex flex-col gap-6">
                    {/* Contact */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Contact</h2>
                        <input
                            type="email"
                            placeholder="Email"
                            value={address.email}
                            onChange={(e) => handleAddress("email", e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {/* Shipping Address */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Adresse de livraison</h2>
                        <div className="space-y-3">
                            <select
                                value={address.country}
                                onChange={(e) => handleAddress("country", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                            >
                                {schengenCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" placeholder="Nom complet" value={address.fullName || ''} onChange={(e) => handleAddress("fullName", e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base" />
                            <input type="text" placeholder="Adresse" value={address.addressLine1 || ''} onChange={(e) => handleAddress("addressLine1", e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base" />
                            <input type="text" placeholder="Appartement, suite, etc. (optionnel)" value={address.addressLine2 || ''} onChange={(e) => handleAddress("addressLine2", e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base" />
                            <div className="grid grid-cols-3 gap-3">
                                <input type="text" placeholder="Code postal" value={address.pincode || ''} onChange={(e) => handleAddress("pincode", e.target.value)} required className="border border-gray-300 rounded-lg px-4 py-3 text-base" />
                                <input type="text" placeholder="Ville" value={address.city || ''} onChange={(e) => handleAddress("city", e.target.value)} required className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 text-base" />
                            </div>
                            <input type="tel" placeholder="Téléphone (optionnel)" value={address.phone || ''} onChange={(e) => handleAddress("phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base" />
                        </div>
                    </div>

                    {/* Promo Code */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Code promo</h2>
                        <div className="flex gap-3">
                            <input type="text" placeholder="Entrez votre code promo" value={address.promoCode || ''} onChange={(e) => handleAddress("promoCode", e.target.value.toUpperCase())} className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base font-mono" />
                            <button type="button" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Appliquer</button>
                        </div>
                    </div>

                    {/* Customer Note */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Note de commande (optionnel)</h2>
                        <textarea
                            placeholder="Instructions spéciales pour la livraison..."
                            value={address.customerNote || ''}
                            onChange={(e) => handleAddress("customerNote", e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base resize-none"
                        />
                    </div>

                    <Button type="submit" isLoading={loading} className="w-full py-7 bg-black text-white rounded-lg font-bold">
                        Continuer vers le paiement
                    </Button>
                </section>

                {/* Order Summary */}
                <aside className="lg:w-[400px] bg-gray-50 p-6 rounded-lg h-fit lg:sticky lg:top-24">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h2>
                    <div className="space-y-4">
                        {productList?.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border">
                                    <img src={item.product.featureImageURL} alt={item.product.title} className="w-full h-full object-cover" />
                                    <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.quantity}</div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium truncate">{item.product.title}</h3>
                                    <p className="text-sm text-gray-500">{(item.product.salePrice * item.quantity).toFixed(2)} €</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-6 pt-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span>{subTotal.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Livraison</span><span>{shippingCost.toFixed(2)} €</span></div>
                    </div>
                    <div className="border-t mt-4 pt-4">
                        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{totalPrice.toFixed(2)} €</span></div>
                    </div>
                </aside>
            </section>
        </form>
    );
}

// Payment Form Component
function PaymentForm({ productList, address, orderNumber, onBack }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const subTotal = productList?.reduce((prev, curr) => prev + curr?.quantity * curr?.product?.salePrice, 0) || 0;
    const shippingCost = 5.90;
    const totalPrice = subTotal + shippingCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout-success`,
                    receipt_email: address.email,
                },
            });

            if (error) {
                toast.error(error.message);
            }
        } catch (err) {
            toast.error('Erreur lors du paiement');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <section className="flex flex-col-reverse lg:flex-row gap-8 max-w-[1200px] mx-auto py-6 px-4 md:px-6">
                <section className="flex-1 flex flex-col gap-6">
                    {/* Back Button */}
                    <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-black flex items-center gap-2">
                        ← Modifier les informations
                    </button>

                    {/* Order Number Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Numéro de commande</p>
                        <p className="font-mono font-bold text-lg">{orderNumber}</p>
                    </div>

                    {/* Shipping Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2">Livraison à :</p>
                        <p className="text-sm text-gray-600">{address.fullName}</p>
                        <p className="text-sm text-gray-600">{address.addressLine1}</p>
                        <p className="text-sm text-gray-600">{address.pincode} {address.city}</p>
                    </div>

                    {/* Payment */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Paiement sécurisé</h2>
                        <div className="border border-gray-300 rounded-lg p-4">
                            <PaymentElement />
                        </div>
                    </div>

                    <Button type="submit" isLoading={isLoading} isDisabled={!stripe || isLoading} className="w-full py-7 bg-black text-white rounded-lg font-bold">
                        {isLoading ? 'Traitement...' : `Payer ${totalPrice.toFixed(2)} €`}
                    </Button>

                    <p className="text-center text-xs text-gray-500">Paiement 100% sécurisé • Powered by Stripe</p>
                </section>

                {/* Order Summary */}
                <aside className="lg:w-[400px] bg-gray-50 p-6 rounded-lg h-fit lg:sticky lg:top-24">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h2>
                    <div className="space-y-4">
                        {productList?.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border">
                                    <img src={item.product.featureImageURL} alt={item.product.title} className="w-full h-full object-cover" />
                                    <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.quantity}</div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium truncate">{item.product.title}</h3>
                                    <p className="text-sm text-gray-500">{(item.product.salePrice * item.quantity).toFixed(2)} €</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-6 pt-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span>{subTotal.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Livraison</span><span>{shippingCost.toFixed(2)} €</span></div>
                    </div>
                    <div className="border-t mt-4 pt-4">
                        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{totalPrice.toFixed(2)} €</span></div>
                    </div>
                </aside>
            </section>
        </form>
    );
}
