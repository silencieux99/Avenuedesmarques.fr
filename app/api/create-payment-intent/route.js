import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp, collection } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { productList, address, userId } = await request.json();

        if (!productList || productList.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        // Calculate total amount
        const subTotal = productList.reduce((prev, curr) => {
            const price = curr?.product?.salePrice && curr?.product?.salePrice > 0 ? curr?.product?.salePrice : curr?.product?.price;
            return prev + (price * curr?.quantity);
        }, 0);

        const shippingCost = address?.shippingCost || 5.90;
        const totalAmount = Math.round((subTotal + shippingCost) * 100); // Convert to cents

        // Generate order number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderNumber = `ADM-${timestamp}-${random}`;

        // Prepare line items for storage
        const lineItems = productList.map((item) => {
            const unitAmount = item?.product?.salePrice && item?.product?.salePrice > 0 ? item?.product?.salePrice : item?.product?.price;
            return {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: item?.product?.title || "Produit",
                        description: item?.product?.shortDescription || "",
                        images: item?.product?.featureImageURL ? [item?.product?.featureImageURL] : [],
                        metadata: {
                            productId: item?.product?.id || item?.id,
                        },
                    },
                    unit_amount: Math.round((unitAmount || 0) * 100),
                },
                quantity: item?.quantity || 1,
            };
        });

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'eur',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderNumber: orderNumber,
                userId: userId || 'guest',
                productCount: productList.length.toString(),
                subtotal: subTotal.toFixed(2),
                shipping: shippingCost.toFixed(2),
                promoCode: address?.promoCode || '',
                customerNote: address?.customerNote || '',
            },
            receipt_email: address?.email,
        });

        // Save order to Firestore before payment
        const orderId = paymentIntent.id;
        await setDoc(doc(db, `orders/${orderId}`), {
            id: orderId,
            orderNumber: orderNumber,
            userId: userId || null,
            isGuest: !userId,

            // Customer info
            customerEmail: address?.email,
            customerName: address?.fullName,

            // Address
            address: address,

            // Products
            line_items: lineItems,

            // Payment
            amountTotal: totalAmount / 100,
            currency: 'eur',
            paymentStatus: 'pending',
            stripePaymentIntentId: paymentIntent.id,

            // Promo & Note
            promoCode: address?.promoCode || null,
            customerNote: address?.customerNote || null,

            // Status
            status: 'pending',

            // Timestamps
            createdAt: Timestamp.now(),
            timestampCreate: Timestamp.now(), // Required for Admin ListView ordering
            updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            orderNumber: orderNumber,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
