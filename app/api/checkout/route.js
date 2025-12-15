import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp, collection } from "firebase/firestore";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { products, address, userId } = await request.json();

        const line_items = products.map((item) => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item?.product?.title,
                    description: item?.product?.shortDescription,
                    images: [item?.product?.featureImageURL],
                    metadata: {
                        productId: item?.product?.id,
                    },
                },
                unit_amount: Math.round(item?.product?.salePrice * 100),
            },
            quantity: item?.quantity,
        }));

        // Add Shipping Line Item
        line_items.push({
            price_data: {
                currency: "eur",
                product_data: {
                    name: "Livraison Standard (7-10 jours)",
                    description: "Expédition suivie",
                },
                unit_amount: 590, // 5.90 EUR in cents
            },
            quantity: 1,
        });

        // Create a unique ID for the order (or use Stripe's session ID)


        // Create a unique ID for the order (or use Stripe's session ID)
        const checkoutId = doc(collection(db, "ids")).id;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-success?checkout_id=${checkoutId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-failed?checkout_id=${checkoutId}`,
            metadata: {
                userId: userId,
                address: JSON.stringify(address),
                checkoutId: checkoutId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
