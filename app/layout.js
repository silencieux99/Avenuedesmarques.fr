import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "slick-carousel/slick/slick.css";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://avenuedesmarques.fr'),
  title: {
    default: "Avenue des Marques - Mode, Luxe & Tendances à Prix Réduits",
    template: "%s | Avenue des Marques"
  },
  description: "Découvrez notre sélection exclusive de vêtements, sacs et accessoires de grandes marques. Livraison rapide, paiement sécurisé et authenticité garantie.",
  keywords: ["mode", "luxe", "marques", "vêtements", "sacs", "accessoires", "pas cher", "avenue des marques"],
  authors: [{ name: "Avenue des Marques" }],
  creator: "Avenue des Marques",
  publisher: "Avenue des Marques",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Avenue des Marques - Mode & Luxe",
    description: "La destination mode pour les amoureux de grandes marques à petits prix.",
    url: 'https://avenuedesmarques.fr',
    siteName: 'Avenue des Marques',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Avenue des Marques",
    description: "Mode, Luxe & Tendances à Prix Réduits",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="text-[14px] md:text-[15px]">
      <body className={`${montserrat.className} bg-white text-black antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
