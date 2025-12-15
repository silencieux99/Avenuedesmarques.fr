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

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

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

async function handleCheckoutSessionCompleted(session) {
    try {
        const checkoutId = session.metadata.checkoutId;
        const userId = session.metadata.userId;
        const isGuest = session.metadata.isGuest === 'true';

        console.log(`Processing checkout session: ${checkoutId}`);

        // Retrieve the checkout session from Firestore
        let checkoutDoc;
        if (isGuest) {
            checkoutDoc = await adminDB.doc(`guest_orders/${checkoutId}`).get();
        } else {
            const checkoutQuery = await adminDB
                .collectionGroup('checkout_sessions')
                .where('id', '==', checkoutId)
                .limit(1)
                .get();

            if (!checkoutQuery.empty) {
                checkoutDoc = checkoutQuery.docs[0];
            }
        }

        if (!checkoutDoc || !checkoutDoc.exists) {
            console.error(`Checkout session not found: ${checkoutId}`);
            return;
        }

        const checkoutData = checkoutDoc.data();

        // Create the order
        const orderId = session.payment_intent || session.id;

        await adminDB.doc(`orders/${orderId}`).set({
            id: orderId,
            checkoutId: checkoutId,
            userId: isGuest ? null : userId,
            isGuest: isGuest,
            customerEmail: session.customer_email || session.customer_details?.email,
            customerName: session.customer_details?.name,

            // Payment info
            paymentStatus: session.payment_status,
            paymentMethod: 'card',
            amountTotal: session.amount_total / 100, // Convert from cents
            currency: session.currency,

            // Line items
            line_items: checkoutData.line_items || [],

            // Address from metadata
            address: checkoutData.metadata?.address ? JSON.parse(checkoutData.metadata.address) : null,

            // Shipping address from Stripe
            shippingAddress: session.shipping_details?.address || session.shipping?.address,
            shippingName: session.shipping_details?.name || session.shipping?.name,

            // Status
            status: 'pending', // Order status (pending, processing, shipped, delivered, cancelled)
            paymentStatus: 'paid',

            // Timestamps
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),

            // Stripe data
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
        });

        // Clear user's cart if not guest
        if (!isGuest && userId && userId !== 'guest') {
            const productIds = (checkoutData.line_items || [])
                .filter(item => item.price_data?.product_data?.metadata?.productId)
                .map(item => item.price_data.product_data.metadata.productId);

            const userDoc = await adminDB.doc(`users/${userId}`).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const newCart = (userData.carts || []).filter(
                    cartItem => !productIds.includes(cartItem.id)
                );

                await adminDB.doc(`users/${userId}`).update({
                    carts: newCart
                });
            }
        }

        // Update product stock and order counts
        const batch = adminDB.batch();
        (checkoutData.line_items || []).forEach(item => {
            const productId = item.price_data?.product_data?.metadata?.productId;
            if (productId) {
                const productRef = adminDB.doc(`products/${productId}`);
                batch.update(productRef, {
                    orders: admin.firestore.FieldValue.increment(item.quantity),
                    stock: admin.firestore.FieldValue.increment(-item.quantity),
                });
            }
        });
        await batch.commit();

        // Update checkout session status
        await checkoutDoc.ref.update({
            status: 'completed',
            completedAt: admin.firestore.Timestamp.now(),
        });

        console.log(`Order created successfully: ${orderId}`);
    } catch (error) {
        console.error('Error handling checkout session completed:', error);
        throw error;
    }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log(`Payment succeeded: ${paymentIntent.id}`);

    // Update order payment status if needed
    const orderDoc = await adminDB.doc(`orders/${paymentIntent.id}`).get();
    if (orderDoc.exists) {
        await orderDoc.ref.update({
            paymentStatus: 'paid',
            updatedAt: admin.firestore.Timestamp.now(),
        });
    }
}

async function handlePaymentIntentFailed(paymentIntent) {
    console.log(`Payment failed: ${paymentIntent.id}`);

    // Update order payment status
    const orderDoc = await adminDB.doc(`orders/${paymentIntent.id}`).get();
    if (orderDoc.exists) {
        await orderDoc.ref.update({
            paymentStatus: 'failed',
            status: 'cancelled',
            updatedAt: admin.firestore.Timestamp.now(),
        });
    }
}
