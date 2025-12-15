import React, { createContext, useContext, useReducer, useEffect } from 'react';
/* eslint-disable react-refresh/only-export-components */

const CART_STORAGE_KEY = 'whimsical-cart-v1';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || [],
      };
    
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => String(item.id) === String(action.payload.id));
      const availableStock = action.payload.stock ?? Infinity;
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > availableStock) {
          return state; // Don't add if exceeds stock
        }
        return {
          ...state,
          items: state.items.map(item =>
            String(item.id) === String(action.payload.id)
              ? { ...item, quantity: newQuantity }
              : item
          ),
        };
      }
      
      if (availableStock <= 0) {
        return state; // Don't add if out of stock
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => String(item.id) !== String(action.payload)),
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const items = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: items });
      }
    } catch (err) {
      console.warn('Failed to load cart from localStorage', err);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [state.items]);

  const addToCart = (product) => {
    const availableStock = product.stock ?? Infinity;
    if (availableStock <= 0) {
      return { ok: false, message: 'Out of stock' };
    }
    dispatch({ type: 'ADD_TO_CART', payload: product });
    return { ok: true };
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId, quantity, maxStock = Infinity) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      return;
    }
    if (quantity > maxStock) {
      quantity = maxStock; // Cap at available stock
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
