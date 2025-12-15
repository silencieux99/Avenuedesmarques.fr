"use client";

import { useOrder } from "@/lib/firestore/orders/read";
import { CircularProgress, Card, CardHeader, CardBody, Divider, Chip, Image, Button } from "@nextui-org/react";
import { useParams } from "next/navigation";
import ChangeOrderStatus from "./components/ChangeStatus";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const { orderId } = useParams();
  const { data: order, error, isLoading } = useOrder({ id: orderId });

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

  const totalAmount = order?.checkout?.line_items?.reduce((prev, curr) => {
    return prev + (curr?.price_data?.unit_amount / 100) * curr?.quantity;
  }, 0);

  const address = JSON.parse(order?.checkout?.metadata?.address ?? "{}");
  const products = order?.checkout?.line_items || [];

  return (
    <main className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button isIconOnly variant="flat" size="sm"><ArrowLeft size={16} /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Commande #{orderId?.slice(0, 8)}...</h1>
        </div>
        <div className="flex gap-3">
          <ChangeOrderStatus order={order} />
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
                <div key={index} className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      width={80}
                      height={80}
                      src={product?.price_data?.product_data?.images?.[0]}
                      alt={product?.price_data?.product_data?.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product?.price_data?.product_data?.name}</h3>
                    <div className="text-sm text-gray-500">
                      Quantité: {product?.quantity}
                    </div>
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product?.price_data?.unit_amount / 100)}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Paiement</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}</span>
              </div>
              {/* Add shipping if available */}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Chip color={order?.paymentMode === 'cod' ? 'warning' : 'success'} variant="flat">
                  {order?.paymentMode === 'cod' ? 'Paiement à la livraison' : 'Stripe / Carte Bancaire'}
                </Chip>
                <Chip color={order?.status === 'paid' ? 'success' : 'default'} variant="flat" className="capitalize">
                  {statusTranslation[order?.status] || order?.status || 'En attente'}
                </Chip>
              </div>
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
                  <div className="font-medium">{address?.fullName || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{address?.email || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Téléphone</div>
                  <div className="font-medium">{address?.mobile || "N/A"}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Livraison</h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full mt-1">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Adresse</div>
                  <div className="font-medium">
                    {address?.addressLine1}<br />
                    {address?.addressLine2 && <>{address?.addressLine2}<br /></>}
                    {address?.pincode} {address?.city}<br />
                    {address?.state && <>{address?.state}, </>}{address?.country || 'France'}
                  </div>
                </div>
              </div>
              {address?.note && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                  <span className="font-bold">Note:</span> {address?.note}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}

const statusTranslation = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};
