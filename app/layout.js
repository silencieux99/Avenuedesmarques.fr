import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "slick-carousel/slick/slick.css";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
  title: "Avenue des Marques - Luxe & Élégance",
  description: "Découvrez les plus grandes marques de luxe et tendance.",
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
