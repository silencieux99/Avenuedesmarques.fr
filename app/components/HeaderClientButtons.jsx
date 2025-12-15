"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/lib/firestore/user/read";
import { Badge } from "@nextui-org/react";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function HeaderClientButtons() {
  const { user } = useAuth();
  const { data } = useUser({ uid: user?.uid });

  return (
    <div className="flex items-center gap-2">
      <Link href={`/favorites`} className="relative group">
        <div className="p-2 hover:bg-gray-50 rounded-full transition-all">
          {(data?.favorites?.length ?? 0) != 0 ? (
            <div className="relative">
              <Heart
                className="w-5 h-5 text-gray-700 group-hover:text-accent transition-colors"
                strokeWidth={1.5}
                fill="currentColor"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {data?.favorites?.length}
              </div>
            </div>
          ) : (
            <Heart
              className="w-5 h-5 text-gray-700 group-hover:text-accent transition-colors"
              strokeWidth={1.5}
            />
          )}
        </div>
      </Link>

      <Link href={`/cart`} className="relative group">
        <div className="p-2 hover:bg-gray-50 rounded-full transition-all">
          {(data?.carts?.length ?? 0) != 0 ? (
            <div className="relative">
              <ShoppingBag
                className="w-5 h-5 text-gray-700 group-hover:text-accent transition-colors"
                strokeWidth={1.5}
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {data?.carts?.length}
              </div>
            </div>
          ) : (
            <ShoppingBag
              className="w-5 h-5 text-gray-700 group-hover:text-accent transition-colors"
              strokeWidth={1.5}
            />
          )}
        </div>
      </Link>
    </div>
  );
}
