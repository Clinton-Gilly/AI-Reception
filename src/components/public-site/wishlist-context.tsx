"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (offeringId: string) => void;
  isInWishlist: (offeringId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("xuremi_wishlist");
    if (saved) {
      try {
        setWishlistIds(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("xuremi_wishlist", JSON.stringify(wishlistIds));
    }
  }, [wishlistIds, isMounted]);

  const toggleWishlist = (offeringId: string) => {
    setWishlistIds((prev) =>
      prev.includes(offeringId)
        ? prev.filter((id) => id !== offeringId)
        : [...prev, offeringId]
    );
  };

  const isInWishlist = (offeringId: string) => wishlistIds.includes(offeringId);

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, toggleWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
