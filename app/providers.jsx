"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import AuthContextProvider from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

export function Providers({ children }) {
    return (
        <NextUIProvider>
            <AuthContextProvider>
                <CartProvider>
                    <Toaster />
                    {children}
                </CartProvider>
            </AuthContextProvider>
        </NextUIProvider>
    );
}
