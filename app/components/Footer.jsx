import Link from "next/link";
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 tracking-wider">
              L'AVENUE<span className="text-accent">.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">
              Votre destination pour les marques de luxe et de prestige.
              Découvrez une sélection exclusive de produits haut de gamme.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-accent flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-accent flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Navigation</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Produits
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Marques
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/nouveautes" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Nouveautés
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <Mail size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <a href="mailto:contact@avenuedesmarques.fr" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  contact@avenuedesmarques.fr
                </a>
              </li>
              <li className="flex gap-3 items-start">
                <Phone size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  Du lundi au vendredi<br />
                  9h - 18h
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  France
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">
            © {currentYear} Avenue des Marques. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="text-gray-400 hover:text-accent text-xs transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="text-gray-400 hover:text-accent text-xs transition-colors">
              CGV
            </Link>
            <Link href="/confidentialite" className="text-gray-400 hover:text-accent text-xs transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
