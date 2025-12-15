import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDB, admin } from '@/lib/firebase_admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature || !webhookSecret) {
            console.error('Missing signature or webhook secret');
            return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed:`, err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        console.log(`Webhook received: ${event.type}`);

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    const orderId = paymentIntent.id;
    console.log(`Payment succeeded for order: ${orderId}`);

    try {
        const orderRef = adminDB.doc(`orders/${orderId}`);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
            const orderData = orderDoc.data();

            // Update order status to paid
            await orderRef.update({
                paymentStatus: 'paid',
                status: 'confirmed',
                updatedAt: admin.firestore.Timestamp.now(),
                stripePaymentIntentId: paymentIntent.id,
            });

            console.log(`Order ${orderId} marked as paid`);

            // Clear user's cart if not guest
            const userId = orderData.userId;
            if (userId && userId !== 'guest') {
                try {
                    const productIds = (orderData.line_items || [])
                        .map(item => item?.price_data?.product_data?.metadata?.productId)
                        .filter(Boolean);

                    const userDoc = await adminDB.doc(`users/${userId}`).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const newCart = (userData.carts || []).filter(
                            cartItem => !productIds.includes(cartItem.id)
                        );
                        await adminDB.doc(`users/${userId}`).update({ carts: newCart });
                        console.log(`Cart cleared for user ${userId}`);
                    }
                } catch (cartError) {
                    console.error('Error clearing cart:', cartError);
                }
            }

            // Update product stock and order counts
            try {
                const batch = adminDB.batch();
                (orderData.line_items || []).forEach(item => {
                    const productId = item?.price_data?.product_data?.metadata?.productId;
                    if (productId) {
                        const productRef = adminDB.doc(`products/${productId}`);
                        batch.update(productRef, {
                            orders: admin.firestore.FieldValue.increment(item.quantity || 1),
                            stock: admin.firestore.FieldValue.increment(-(item.quantity || 1)),
                        });
                    }
                });
                await batch.commit();
                console.log('Product stock updated');
            } catch (stockError) {
                console.error('Error updating stock:', stockError);
            }

        } else {
            console.log(`Order ${orderId} not found in Firestore`);
        }
    } catch (error) {
        console.error('Error handling payment succeeded:', error);
        throw error;
    }
}

async function handlePaymentIntentFailed(paymentIntent) {
    const orderId = paymentIntent.id;
    console.log(`Payment failed for order: ${orderId}`);

    try {
        const orderRef = adminDB.doc(`orders/${orderId}`);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
            await orderRef.update({
                paymentStatus: 'failed',
                status: 'cancelled',
                updatedAt: admin.firestore.Timestamp.now(),
                failureMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
            });
            console.log(`Order ${orderId} marked as failed`);
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
        throw error;
    }
}
