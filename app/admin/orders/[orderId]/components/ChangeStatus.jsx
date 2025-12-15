"use client";

import { updateOrderStatus } from "@/lib/firestore/orders/write";
import toast from "react-hot-toast";

export default function ChangeOrderStatus({ order }) {
  const handleChangeStatus = async (status) => {
    try {
      if (!status) {
        toast.error("Please Select Status");
      }
      await toast.promise(
        updateOrderStatus({ id: order?.id, status: status }),
        {
          error: (e) => e?.message,
          loading: "Updating...",
          success: "Successfully Updated",
        }
      );
    } catch (error) {
      toast.error(error?.message);
    }
  };
  return (
    <select
      value={order?.status}
      onChange={(e) => {
        handleChangeStatus(e.target.value);
      }}
      name="change-order-status"
      id="change-order-status"
      className="px-4 py-2 border rounded-lg bg-white"
    >
      <option value="">Modifier le statut</option>
      <option value="pending">En attente (Pending)</option>
      <option value="confirmed">Confirmée</option>
      <option value="processing">En préparation</option>
      <option value="shipped">Expédiée</option>
      <option value="out_for_delivery">En cours de livraison</option>
      <option value="delivered">Livrée</option>
      <option value="cancelled">Annulée</option>
    </select>
  );
}
