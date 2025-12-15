"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
    return (
        <NextUIProvider>
            <Toaster />
            {children}
        </NextUIProvider>
    );
}
