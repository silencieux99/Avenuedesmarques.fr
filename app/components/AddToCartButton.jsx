"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@nextui-org/react";
import { useState } from "react";
import toast from "react-hot-toast";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

export default function AddToCartButton({ productId, type }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const isAdded = cart?.find((item) => item?.id === productId);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isAdded) {
        await removeFromCart(productId);
        toast.success("Produit retiré du panier");
      } else {
        await addToCart(productId, 1);
        toast.success("Produit ajouté au panier");
      }
    } catch (error) {
      toast.error(error?.message || "Une erreur est survenue");
    }
    setIsLoading(false);
  };

  if (type === "cute") {
    return (
      <Button
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={handleClick}
        variant="bordered"
        className=""
      >
        {!isAdded && "Ajouter au panier"}
        {isAdded && "Retirer du panier"}
      </Button>
    );
  }

  if (type === "large") {
    return (
      <Button
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={handleClick}
        variant="bordered"
        className=""
        color="primary"
        size="sm"
      >
        {!isAdded && <AddShoppingCartIcon className="text-xs" />}
        {isAdded && <ShoppingCartIcon className="text-xs" />}
        {!isAdded && "Ajouter au panier"}
        {isAdded && "Retirer du panier"}
      </Button>
    );
  }

  return (
    <Button
      isLoading={isLoading}
      isDisabled={isLoading}
      onClick={handleClick}
      variant="flat"
      isIconOnly
      size="sm"
    >
      {!isAdded && <AddShoppingCartIcon className="text-xs" />}
      {isAdded && <ShoppingCartIcon className="text-xs" />}
    </Button>
  );
}
