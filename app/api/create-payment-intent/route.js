import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { productList } = await request.json();

        if (!productList || productList.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        // Calculate total amount
        const subTotal = productList.reduce((prev, curr) => {
            return prev + (curr?.quantity * curr?.product?.salePrice);
        }, 0);

        const shippingCost = 5.90;
        const totalAmount = Math.round((subTotal + shippingCost) * 100); // Convert to cents

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'eur',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                productCount: productList.length,
                subtotal: subTotal.toFixed(2),
                shipping: shippingCost.toFixed(2),
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
