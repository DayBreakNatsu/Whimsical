import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import formatCurrency from '../utils/formatCurrency';
import { useSiteContent } from '../context/SiteContentContext';
import { createOrder } from '../services/orderService';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { content } = useSiteContent();
  const shippingFee = content?.general?.shippingFee ?? 0;
  const taxRate = content?.general?.taxRate ?? 0;
  const facebookUrl = content?.socials?.facebook || '#';

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      // Get current product to check stock
      const product = content.products?.find(p => p.id === productId);
      const maxStock = product?.stock ?? Infinity;
      updateQuantity(productId, newQuantity, maxStock);
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setCheckoutError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.name.trim() || !checkoutForm.email.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      setCheckoutError('Please fill in your name, email, contact number, and address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCheckoutError('');

      const subtotal = getTotalPrice();
      const tax = subtotal * taxRate;
      const total = subtotal + shippingFee + tax;

      const orderData = {
        user_id: null,
        email: checkoutForm.email.trim(),
        shipping_address: {
          name: checkoutForm.name.trim(),
          email: checkoutForm.email.trim(),
          phone: checkoutForm.phone.trim(),
          address: checkoutForm.address.trim(),
        },
        items: items.map((item) => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        shipping_fee: shippingFee,
        tax,
        total,
        notes: checkoutForm.notes?.trim() || null,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'manual',
      };

      const { data, error } = await createOrder(orderData);
      if (error) {
        setCheckoutError(error.error || 'Failed to place order. Please try again.');
        return;
      }

      setLastOrder(data);
      clearCart();
      setIsCheckingOut(false);
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckoutError('Something went wrong. Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show empty-cart page only when there is no active checkout or receipt
  if (items.length === 0 && !isCheckingOut && !lastOrder) {
    return (
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-soft-brown mb-8">Your Cart</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-600 mb-6">Your cart is empty</p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-soft-brown mb-8">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 mb-4 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-soft-brown">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.category}</p>
                      <p className="text-accent-red font-semibold">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-muted-pink flex items-center justify-center hover:bg-muted-pink transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={(() => {
                          const product = content.products?.find(p => p.id === item.id);
                          const maxStock = product?.stock ?? Infinity;
                          return item.quantity >= maxStock;
                        })()}
                        className={`w-8 h-8 rounded-full border border-muted-pink flex items-center justify-center transition-colors ${
                          (() => {
                            const product = content.products?.find(p => p.id === item.id);
                            const maxStock = product?.stock ?? Infinity;
                            return item.quantity >= maxStock
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'hover:bg-muted-pink';
                          })()
                        }`}
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 transition-colors mt-4"
              >
                Clear Cart
              </button>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-soft-brown mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({items.reduce((total, item) => total + item.quantity, 0)} items)</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(getTotalPrice() * taxRate)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-soft-brown">
                    <span>Total</span>
                    <span>{formatCurrency(getTotalPrice() + shippingFee + getTotalPrice() * taxRate)}</span>
                  </div>
                </div>
              </div>
              
              <button
                className="btn-primary w-full mb-4"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>
              
              <Link to="/products" className="block text-center text-soft-brown hover:text-accent-red transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ / Instructions */}
        <div className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl shadow-md p-6 border border-beige/60">
          <h2 className="text-xl font-semibold text-soft-brown mb-3">How checkout works</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Fill in your details and place your order using the checkout form.</li>
            <li>After placing an order, a receipt will appear with your order number and items.</li>
            <li>Take a screenshot of that receipt and send it to our Facebook page so we can confirm your order.</li>
          </ul>
          {facebookUrl && facebookUrl !== '#' && (
            <p className="mt-4 text-sm">
              Facebook page:{' '}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent-red underline hover:text-red-700"
              >
                Message us on Facebook
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Checkout modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCheckingOut(false)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red"
              aria-label="Close checkout"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold text-soft-brown mb-4">Checkout</h2>
            <p className="text-sm text-gray-600 mb-4">
              Fill in your details below. After confirming, you&apos;ll see a receipt that you can screenshot and send to us.
            </p>
            <form className="space-y-4" onSubmit={handleSubmitOrder}>
              <div>
                <label className="block text-sm font-medium text-soft-brown">
                  Name
                  <input
                    type="text"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-brown">
                  Email
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-brown">
                  Contact Number
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-brown">
                  Address
                  <textarea
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    rows={3}
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-brown">
                  Notes (optional)
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    rows={2}
                  />
                </label>
              </div>
              {checkoutError && <p className="text-sm text-red-500">{checkoutError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="rounded-full border border-beige/60 px-4 py-2 text-soft-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-60"
                >
                  {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setLastOrder(null)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red"
              aria-label="Close receipt"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold text-soft-brown mb-2">Order Receipt</h2>
            <p className="text-xs text-gray-500 mb-4">
              Order ID: {lastOrder.id} · Placed at {new Date(lastOrder.created_at).toLocaleString()}
            </p>
            <div className="space-y-3 text-sm text-gray-700 mb-4">
              <p><span className="font-semibold">Name:</span> {lastOrder.shipping_address?.name}</p>
              <p><span className="font-semibold">Email:</span> {lastOrder.email}</p>
              <p><span className="font-semibold">Contact:</span> {lastOrder.shipping_address?.phone}</p>
              <p><span className="font-semibold">Address:</span> {lastOrder.shipping_address?.address}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-soft-brown mb-2">Items</h3>
              <div className="space-y-2 text-sm">
                {Array.isArray(lastOrder.items) &&
                  lastOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="border-t pt-3 text-sm space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(lastOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(lastOrder.shipping_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(lastOrder.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-soft-brown pt-1">
                <span>Total</span>
                <span>{formatCurrency(lastOrder.total)}</span>
              </div>
            </div>
            <div className="bg-beige/40 rounded-2xl p-4 text-sm text-soft-brown mb-4">
              <p className="font-semibold mb-1">Next step</p>
              <p>
                Please take a screenshot of this receipt and send it to our Facebook page so we can confirm your order.
              </p>
              {facebookUrl && facebookUrl !== '#' && (
                <p className="mt-2">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-red underline hover:text-red-700"
                  >
                    Open Facebook page
                  </a>
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="rounded-full border border-beige/60 px-4 py-2 text-soft-brown"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
