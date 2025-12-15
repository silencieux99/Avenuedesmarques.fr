import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp, collection } from "firebase/firestore";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { products, address, userId } = await request.json();

        if (!products || products.length === 0) {
            return NextResponse.json({ error: "No products provided" }, { status: 400 });
        }

        const line_items = products.map((item) => ({
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
                unit_amount: Math.round((item?.product?.salePrice || item?.product?.price || 0) * 100),
            },
            quantity: item?.quantity || 1,
        }));

        // Add Shipping Line Item
        const shippingCost = address?.shippingCost || 5.90;
        line_items.push({
            price_data: {
                currency: "eur",
                product_data: {
                    name: address?.shippingMethod || "Livraison Standard (7-10 jours)",
                    description: "Expédition suivie",
                },
                unit_amount: Math.round(shippingCost * 100),
            },
            quantity: 1,
        });

        // Create a unique checkout ID
        const checkoutId = doc(collection(db, "ids")).id;

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-success?checkout_id=${checkoutId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-failed?checkout_id=${checkoutId}`,
            customer_email: address?.email,
            metadata: {
                checkoutId: checkoutId,
                userId: userId || "guest",
                isGuest: userId ? "false" : "true",
            },
            shipping_address_collection: {
                allowed_countries: ['FR', 'BE', 'CH', 'DE', 'ES', 'IT', 'LU', 'NL', 'PT'],
            },
        });

        // Save checkout session to Firestore
        const checkoutRef = userId
            ? doc(db, `users/${userId}/checkout_sessions/${checkoutId}`)
            : doc(db, `guest_orders/${checkoutId}`);

        await setDoc(checkoutRef, {
            id: checkoutId,
            sessionId: session.id,
            line_items: line_items,
            metadata: {
                checkoutId: checkoutId,
                userId: userId || null,
                isGuest: !userId,
                address: JSON.stringify(address),
            },
            status: "pending",
            createdAt: Timestamp.now(),
            url: session.url,
        });

        return NextResponse.json({ url: session.url, checkoutId: checkoutId });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({
            error: error.message || "Une erreur est survenue lors de la création du paiement"
        }, { status: 500 });
    }
}
