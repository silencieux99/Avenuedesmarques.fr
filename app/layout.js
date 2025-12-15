import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css"; // Removing to fix font loading error with Turbopack. Custom styles should be used.

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});


export const metadata = {
  title: "L'Avenue des Marques | Mode & Luxe",
  description: "La destination ultime pour la mode de luxe.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <Toaster />
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  );
}
