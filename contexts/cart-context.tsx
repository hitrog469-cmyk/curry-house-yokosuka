'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CART_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  // Add other fields as needed
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedTimestamp = localStorage.getItem('cart_timestamp');

    if (savedCart && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();

      // Check if cart has expired (15 minutes)
      if (now - timestamp < CART_EXPIRY_TIME) {
        setCart(JSON.parse(savedCart));
        setLastActivity(timestamp);
      } else {
        // Cart expired, clear it
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_timestamp');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
      localStorage.setItem('cart_timestamp', Date.now().toString());
      setLastActivity(Date.now());
    }
  }, [cart]);

  // Auto-clear cart after 15 minutes of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > CART_EXPIRY_TIME) {
        setCart([]);
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_timestamp');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastActivity]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    localStorage.removeItem('cart_timestamp');
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
