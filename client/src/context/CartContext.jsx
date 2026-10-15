import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsphere_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse cart from localStorage:', e);
      return [];
    }
  });

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('shopsphere_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  /**
   * Add a product to the cart
   * @param {Object} product - Product object
   * @param {number} quantity - Quantity to add
   */
  const addToCart = (product, quantity = 1) => {
    if (!product || product.stock <= 0) {
      return { success: false, message: 'Product is out of stock.' };
    }

    let message = 'Added to cart';
    let success = true;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.product._id === product._id
      );

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const targetQty = currentQty + quantity;

        if (targetQty > product.stock) {
          message = `Cannot add more. Maximum available stock is ${product.stock}.`;
          const updated = [...prevItems];
          updated[existingIndex].quantity = product.stock;
          return updated;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: targetQty,
        };
        return updated;
      } else {
        const safeQty = Math.min(quantity, product.stock);
        return [
          ...prevItems,
          {
            product: {
              _id: product._id,
              name: product.name,
              imageUrl: product.imageUrl,
              pricePaise: product.pricePaise,
              stock: product.stock,
              slug: product.slug,
              category: product.category,
            },
            quantity: safeQty,
          },
        ];
      }
    });

    return { success, message };
  };

  /**
   * Update quantity of an item in the cart
   */
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product._id === productId) {
          const clampedQty = Math.min(newQuantity, item.product.stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  /**
   * Remove an item from the cart
   */
  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product._id !== productId)
    );
  };

  /**
   * Clear all items in the cart
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations in integer paise
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotalPaise = cartItems.reduce(
    (acc, item) => acc + item.product.pricePaise * item.quantity,
    0
  );

  // Free shipping above ₹999 (99900 paise), else ₹99 (9900 paise)
  const shippingPaise =
    cartItems.length === 0 ? 0 : subtotalPaise >= 99900 ? 0 : 9900;

  const totalAmountPaise = subtotalPaise + shippingPaise;

  const value = {
    cartItems,
    totalItemsCount,
    subtotalPaise,
    shippingPaise,
    totalAmountPaise,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
