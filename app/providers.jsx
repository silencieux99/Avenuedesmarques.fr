"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import AuthContextProvider from "@/contexts/AuthContext";

export function Providers({ children }) {
    return (
        <NextUIProvider>
            <AuthContextProvider>
                <Toaster />
                {children}
            </AuthContextProvider>
        </NextUIProvider>
    );
}
