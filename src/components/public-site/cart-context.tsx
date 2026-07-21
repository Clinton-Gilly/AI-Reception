"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PublicOffering } from "./types";

export interface CartItem {
  offering: PublicOffering;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (offering: PublicOffering) => void;
  removeFromCart: (offeringId: string) => void;
  updateQuantity: (offeringId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPriceMinor: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("xuremi_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("xuremi_cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (offering: PublicOffering) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.offering._id === offering._id);
      if (existing) {
        return prev.map((item) =>
          item.offering._id === offering._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { offering, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (offeringId: string) => {
    setItems((prev) => prev.filter((item) => item.offering._id !== offeringId));
  };

  const updateQuantity = (offeringId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(offeringId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.offering._id === offeringId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPriceMinor = items.reduce(
    (sum, item) => sum + item.offering.priceMinor * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPriceMinor,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
