"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Check, Copy, Package, Mail, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [copied, setCopied] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (redirectStatus === 'succeeded' && paymentIntent) {
        try {
          // Fetch order from Firestore using payment intent ID
          const orderDoc = await getDoc(doc(db, 'orders', paymentIntent));

          if (orderDoc.exists()) {
            const data = orderDoc.data();
            setOrderData(data);
            setOrderNumber(data.orderNumber || paymentIntent);
          } else {
            // Fallback: generate order number from payment intent
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = paymentIntent.slice(-6).toUpperCase();
            setOrderNumber(`ADM-${timestamp}-${random}`);
          }

          // Clear cart from localStorage if guest
          if (typeof window !== 'undefined') {
            localStorage.removeItem('guestCart');
          }

          // Launch confetti
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 500);
        } catch (error) {
          console.error('Error fetching order:', error);
        }
      }
      setLoading(false);
    };

    fetchOrder();
  }, [redirectStatus, paymentIntent]);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="pt-32 pb-20 flex flex-col gap-3 justify-center items-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-gray-600">Confirmation de votre commande...</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (redirectStatus !== 'succeeded') {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="pt-32 pb-20 flex flex-col gap-6 justify-center items-center px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold">Paiement non confirmé</h1>
          <p className="text-gray-600">Votre paiement n'a pas pu être confirmé.</p>
          <Link href="/checkout">
            <button className="px-6 py-3 bg-black text-white rounded-lg">Réessayer</button>
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Merci pour votre commande !
            </h1>
            <p className="text-gray-600 text-lg">
              Votre paiement a été confirmé avec succès.
            </p>
          </div>

          {/* Order Number Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Numéro de commande</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl md:text-3xl font-mono font-bold text-gray-900 tracking-wider">
                  {orderNumber}
                </span>
                <button
                  onClick={copyOrderNumber}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copier"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-2 animate-pulse">Copié dans le presse-papier !</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email de confirmation envoyé</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {orderData?.customerEmail ? (
                      <>Un email a été envoyé à <strong>{orderData.customerEmail}</strong> avec le récapitulatif de votre commande.</>
                    ) : (
                      'Vous recevrez un email avec le récapitulatif de votre commande.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Preview */}
          {orderData?.line_items && orderData.line_items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Votre commande</h3>
              <div className="space-y-3">
                {orderData.line_items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {item.price_data?.product_data?.images?.[0] && (
                        <img
                          src={item.price_data.product_data.images[0]}
                          alt={item.price_data.product_data.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.price_data?.product_data?.name}</p>
                      <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">
                      {((item.price_data?.unit_amount / 100) * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{orderData.amountTotal?.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Conservez votre numéro de commande</p>
                <p className="text-sm text-gray-300 mt-1">
                  Il vous permettra de suivre votre livraison à tout moment.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/track-order" className="flex-1">
              <button className="w-full px-6 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                Suivre ma commande
              </button>
            </Link>
            <Link href="/" className="flex-1">
              <button className="w-full px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                Continuer mes achats
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>

          {/* Reference */}
          <p className="text-center text-xs text-gray-400 mt-10">
            Référence paiement : {paymentIntent}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
