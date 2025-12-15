"use client";

import { useOrder } from "@/lib/firestore/orders/read";
import { CircularProgress, Card, CardHeader, CardBody, Divider, Chip, Image, Button } from "@nextui-org/react";
import { useParams } from "next/navigation";
import ChangeOrderStatus from "./components/ChangeStatus";
import { ArrowLeft, Mail, MapPin, Phone, User, Copy, Check, Package, CreditCard, Tag, MessageSquare, Clock, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const { orderId } = useParams();
  const { data: order, error, isLoading } = useOrder({ id: orderId });
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-48">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Get data from different possible sources
  const totalAmount = order?.amountTotal || order?.checkout?.line_items?.reduce((prev, curr) => {
    return prev + (curr?.price_data?.unit_amount / 100) * curr?.quantity;
  }, 0) || 0;

  const address = order?.address || (order?.checkout?.metadata?.address ? JSON.parse(order?.checkout?.metadata?.address) : {});
  const products = order?.line_items || order?.checkout?.line_items || [];

  // Generate order number (same logic as success page)
  const orderNumber = order?.orderNumber || (() => {
    const timestamp = order?.createdAt?.seconds ?
      new Date(order.createdAt.seconds * 1000).getTime().toString(36).toUpperCase() :
      Date.now().toString(36).toUpperCase();
    const random = orderId?.slice(-6).toUpperCase() || 'XXXXXX';
    return `ADM-${timestamp}-${random}`;
  })();

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button isIconOnly variant="flat" size="sm"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Détail de la commande</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm text-gray-600">{orderNumber}</span>
              <button onClick={copyOrderNumber} className="p-1 hover:bg-gray-100 rounded">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Chip
            color={statusColorMap[order?.status] || 'default'}
            variant="flat"
            className="capitalize"
            startContent={<StatusIcon status={order?.status} />}
          >
            {statusTranslation[order?.status] || order?.status || 'En attente'}
          </Chip>
          <ChangeOrderStatus order={order} />
        </div>
      </div>

      {/* Order Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Clock size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Date</div>
            <div className="text-sm font-medium">{formatDate(order?.createdAt || order?.timestampCreate)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <CreditCard size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Paiement</div>
            <div className="text-sm font-medium">{order?.paymentStatus === 'paid' ? 'Payé' : 'En attente'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Package size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Articles</div>
            <div className="text-sm font-medium">{products.length} produit(s)</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Truck size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Livraison</div>
            <div className="text-sm font-medium">{address?.shippingMethod || 'Standard'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Products List */}
          <Card>
            <CardHeader className="flex gap-3">
              <h2 className="text-lg font-semibold">Articles ({products.length})</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              {products.map((product, index) => (
                <div key={index} className="flex gap-4 items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product?.price_data?.product_data?.images?.[0] ? (
                      <Image
                        width={80}
                        height={80}
                        src={product?.price_data?.product_data?.images?.[0]}
                        alt={product?.price_data?.product_data?.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product?.price_data?.product_data?.name || 'Produit'}</h3>
                    <div className="text-sm text-gray-500">
                      Quantité: {product?.quantity} × {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product?.price_data?.unit_amount / 100)}
                    </div>
                    {product?.price_data?.product_data?.metadata?.productId && (
                      <Link href={`/admin/products/${product.price_data.product_data.metadata.productId}`}>
                        <span className="text-xs text-blue-600 hover:underline">Voir le produit</span>
                      </Link>
                    )}
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((product?.price_data?.unit_amount / 100) * product?.quantity)}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Customer Note */}
          {(address?.customerNote || address?.note) && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex gap-3">
                <MessageSquare size={20} className="text-yellow-600" />
                <h2 className="text-lg font-semibold">Note du client</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                <p className="text-gray-700 italic">"{address?.customerNote || address?.note}"</p>
              </CardBody>
            </Card>
          )}

          {/* Promo Code */}
          {address?.promoCode && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex gap-3">
                <Tag size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold">Code promo utilisé</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                <Chip color="success" variant="flat" className="font-mono font-bold">
                  {address?.promoCode}
                </Chip>
              </CardBody>
            </Card>
          )}

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Récapitulatif du paiement</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount - (address?.shippingCost || 5.90))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(address?.shippingCost || 5.90)}</span>
              </div>
              {address?.promoCode && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction ({address?.promoCode})</span>
                  <span>-0,00 €</span>
                </div>
              )}
              <Divider className="my-2" />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Chip color="success" variant="flat" startContent={<CreditCard size={14} />}>
                  Stripe / Carte Bancaire
                </Chip>
                <Chip color={order?.paymentStatus === 'paid' ? 'success' : 'warning'} variant="flat">
                  {order?.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                </Chip>
              </div>
              {order?.stripePaymentIntentId && (
                <p className="text-xs text-gray-400 mt-2">
                  Réf. Stripe: {order.stripePaymentIntentId}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Customer Info */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Client</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Nom complet</div>
                  <div className="font-medium">{address?.fullName || order?.customerName || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{address?.email || order?.customerEmail || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Téléphone</div>
                  <div className="font-medium">{address?.phone || address?.mobile || "N/A"}</div>
                </div>
              </div>
              {order?.isGuest && (
                <Chip color="default" variant="flat" size="sm">
                  Commande invité
                </Chip>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Adresse de livraison</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full mt-1">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="font-medium">
                    {address?.addressLine1 || order?.shippingAddress?.line1 || 'N/A'}<br />
                    {(address?.addressLine2 || order?.shippingAddress?.line2) && <>{address?.addressLine2 || order?.shippingAddress?.line2}<br /></>}
                    {address?.pincode || order?.shippingAddress?.postal_code} {address?.city || order?.shippingAddress?.city}<br />
                    {address?.country || order?.shippingAddress?.country || 'France'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Order ID Reference */}
          <Card className="bg-gray-50">
            <CardBody className="flex flex-col gap-2">
              <div className="text-sm text-gray-500">ID Firestore</div>
              <div className="font-mono text-xs break-all">{orderId}</div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}

const statusColorMap = {
  pending: "warning",
  confirmed: "primary",
  processing: "primary",
  shipped: "secondary",
  out_for_delivery: "secondary",
  delivered: "success",
  cancelled: "danger",
};

const statusTranslation = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function StatusIcon({ status }) {
  switch (status) {
    case 'pending': return <Clock size={14} />;
    case 'processing': return <Package size={14} />;
    case 'shipped': return <Truck size={14} />;
    case 'delivered': return <Check size={14} />;
    default: return null;
  }
}
