"use client";

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckoutWrapper({ productList }) {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Create PaymentIntent as soon as the page loads
        const createPaymentIntent = async () => {
            try {
                setLoading(true);

                const response = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productList }),
                });

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                setClientSecret(data.clientSecret);
            } catch (err) {
                console.error('Error creating payment intent:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productList && productList.length > 0) {
            createPaymentIntent();
        }
    }, [productList]);

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#000000',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'Montserrat, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
        },
        rules: {
            '.Input': {
                border: '1px solid #e5e7eb',
                boxShadow: 'none',
                padding: '12px',
            },
            '.Input:focus': {
                border: '1px solid #000000',
                boxShadow: '0 0 0 1px #000000',
            },
            '.Label': {
                fontWeight: '500',
                marginBottom: '8px',
            },
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Erreur : {error}</p>
            </div>
        );
    }

    if (!clientSecret) {
        return null;
    }

    return (
        <Elements options={options} stripe={stripePromise}>
            <CheckoutForm productList={productList} />
        </Elements>
    );
}
