import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../../utils/api';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  pointsCost?: number;
  quantity: number;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  totalPoints: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, accessToken } = useAuth();

  // Load cart from backend when user logs in
  useEffect(() => {
    if (user && accessToken) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user, accessToken]);

  const loadCart = async () => {
    if (!accessToken) return;

    try {
      const { cart } = await api.getCart(accessToken);
      setItems(cart.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    if (!accessToken) return;

    try {
      await api.updateCart(accessToken, newItems);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: any) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);

      let newItems;
      if (existingItem) {
        newItems = prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            pointsCost: product.pointsCost,
            quantity: 1,
            description: product.description,
          },
        ];
      }

      saveCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.productId !== productId);
      saveCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (accessToken) {
      saveCart([]);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPoints = items.reduce((sum, item) => sum + (item.pointsCost || Math.round(item.price)) * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, totalPoints, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
