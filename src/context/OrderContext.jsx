import React, { createContext, useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus as updateOrderStatusApi, deleteOrder as deleteOrderApi } from '../services/orderService';
/* eslint-disable react-refresh/only-export-components */

export const OrderContext = createContext();

export function useOrders() {
  const context = React.useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real orders from API
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await getAllOrders();
      if (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    // Update local state immediately for responsive UI
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // Update in Supabase
    const { error } = await updateOrderStatusApi(orderId, newStatus);
    if (error) {
      console.error('Failed to update order status:', error);
      // Revert local state on error
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: order.status } : order
        )
      );
    }
  };

  const deleteOrder = async (orderId) => {
    // Delete from Supabase first
    const { error } = await deleteOrderApi(orderId);
    if (error) {
      console.error('Failed to delete order:', error);
      return;
    }
    
    // Update local state on success
    setOrders(prevOrders =>
      prevOrders.filter(order => order.id !== orderId)
    );
  };

  const addOrder = (orderData) => {
    const newOrder = {
      id: `ORD-2025-${String(orders.length + 1).padStart(3, '0')}`,
      ...orderData,
      date: new Date().toISOString(),
      status: 'pending'
    };
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    
    // In a real app, you'd make an API call:
    // await fetch('/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newOrder)
    // });
    
    return newOrder;
  };

  const value = {
    orders,
    loading,
    updateOrderStatus,
    deleteOrder,
    addOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
