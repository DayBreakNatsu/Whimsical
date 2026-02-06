import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import formatCurrency from '../utils/formatCurrency';
import showToast from '../utils/toast';
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

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getTotalPrice();
  const tax = subtotal * taxRate;
  const total = subtotal + shippingFee + tax;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      showToast('Item removed from cart', 'info');
    } else {
      const product = content.products?.find(p => p.id === productId);
      const maxStock = product?.stock ?? Infinity;
      if (newQuantity > maxStock) {
        showToast(`Only ${maxStock} items available`, 'error');
      } else {
        updateQuantity(productId, newQuantity, maxStock);
      }
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setCheckoutError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.name.trim() || !checkoutForm.email.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      setCheckoutError('Please fill in all required fields.');
      showToast('Please complete all fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setCheckoutError('');

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
          product_id: String(item.id).trim(), // Ensure it's a clean string
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
        // More descriptive error handling for different scenarios
        let errorMsg = error.error || 'Failed to place order. Please try again.';
        
        if (error.code === 'INSUFFICIENT_STOCK') {
          errorMsg = `⚠️ ${errorMsg} Items may have sold out during checkout. Please refresh and try again.`;
        } else if (errorMsg.includes('Insufficient stock')) {
          errorMsg = '⚠️ One or more items are out of stock. Please update your cart and retry.';
        }
        
        setCheckoutError(errorMsg);
        showToast(errorMsg, 'error');
        console.error('Order error:', error);
        return;
      }

      setLastOrder(data);
      clearCart();
      setIsCheckingOut(false);
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckoutError('Something went wrong. Please try again');
      showToast('Checkout error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show empty-cart page only when there is no active checkout or receipt
  if (items.length === 0 && !isCheckingOut && !lastOrder) {
    return (
      <div className="py-20 min-h-[60vh] bg-gradient-to-b from-beige/20 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="text-4xl font-bold text-soft-brown mb-3">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Discover our handcrafted bouquets and whimsical accessories to get started!
          </p>
          <div className="bg-white rounded-3xl shadow-lg p-12 border border-beige/30">
            <Link to="/products" className="btn-primary inline-block px-8 py-3">
              🛍️ Start Shopping
            </Link>
            <p className="text-gray-500 text-sm mt-6">or</p>
            <Link to="/" className="text-soft-brown hover:text-accent-red mt-6 inline-block">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gradient-to-b from-white to-beige/20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="uppercase tracking-[0.5em] text-xs text-soft-brown/70 mb-2">Shopping</p>
          <h1 className="text-4xl font-bold text-soft-brown mb-2">Your Cart</h1>
          <p className="text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-md p-6 border border-beige/30">
              {items.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {items.map(item => {
                      const product = content.products?.find(p => p.id === item.id);
                      const maxStock = product?.stock ?? Infinity;
                      return (
                        <div key={item.id} className="flex gap-4 pb-4 border-b border-beige/30 last:border-b-0 last:pb-0 hover:bg-beige/10 p-3 rounded-2xl transition">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-2xl bg-beige/20"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/100/F5E6D3/8B4513'; }}
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-soft-brown text-lg mb-1">{item.name}</h3>
                            <p className="text-xs text-soft-brown/60 mb-2">📁 {item.category}</p>
                            <p className="text-accent-red font-bold text-lg">{formatCurrency(item.price)}</p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-1 bg-beige/40 rounded-full p-1">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full hover:bg-muted-pink flex items-center justify-center transition-colors font-semibold text-soft-brown"
                                title="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="w-10 text-center font-semibold text-soft-brown">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= maxStock}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors font-semibold ${
                                  item.quantity >= maxStock
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'hover:bg-muted-pink text-soft-brown'
                                }`}
                                title={item.quantity >= maxStock ? 'Max stock reached' : 'Increase quantity'}
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                              title="Remove from cart"
                            >
                              ✕ Remove
                            </button>
                            <span className="text-xs text-gray-500">
                              Subtotal: {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clear Cart Button */}
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all items from cart?')) {
                        clearCart();
                        showToast('Cart cleared', 'info');
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    🗑️ Clear All Items
                  </button>
                </>
              ) : (
                <p className="text-center text-gray-500">Cart is empty</p>
              )}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-md p-6 border border-beige/30 sticky top-20">
              <h2 className="text-2xl font-semibold text-soft-brown mb-6">💰 Order Summary</h2>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-beige/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-soft-brown">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-soft-brown">{formatCurrency(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span className="font-semibold text-soft-brown">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                </div>
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-gradient-to-r from-accent-red/10 to-muted-pink/10 rounded-2xl">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-soft-brown">Total Amount</span>
                  <span className="text-3xl font-bold text-accent-red">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  className="btn-primary w-full py-3 disabled:opacity-50"
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                >
                  🛒 Proceed to Checkout
                </button>
                
                <Link to="/products" className="block text-center btn-secondary w-full py-3">
                  ← Continue Shopping
                </Link>
              </div>

              {/* Info Box */}
              <div className="mt-6 pt-6 border-t border-beige/30">
                <p className="text-xs text-gray-500 text-center">
                  💳 We'll guide you through checkout and order confirmation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ / Instructions */}
        <div className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-beige/40 to-muted-pink/20 rounded-3xl shadow-md p-8 border border-beige/40">
          <h2 className="text-2xl font-semibold text-soft-brown mb-4">❓ How Checkout Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <p className="font-semibold text-soft-brown mb-2">Fill Your Details</p>
              <p className="text-sm text-gray-600">Enter your name, email, contact number, and delivery address.</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <p className="font-semibold text-soft-brown mb-2">Confirm Order</p>
              <p className="text-sm text-gray-600">Review your order and click confirm. Your receipt will appear instantly.</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <p className="font-semibold text-soft-brown mb-2">Send Receipt</p>
              <p className="text-sm text-gray-600">Screenshot your receipt and send it to us via Facebook for confirmation.</p>
            </div>
          </div>
          {facebookUrl && facebookUrl !== '#' && (
            <div className="mt-6 p-4 bg-white rounded-2xl text-center">
              <p className="text-sm text-gray-600 mb-3">📱 Ready to message us?</p>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-accent-red text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition"
              >
                💬 Message on Facebook
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsCheckingOut(false)}
              className="sticky top-4 right-4 float-right text-soft-brown hover:text-accent-red text-2xl transition"
              aria-label="Close checkout"
            >
              ✕
            </button>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-soft-brown mb-2">🛒 Checkout</h2>
              <p className="text-sm text-gray-600 mb-6">
                Fill in your details below. After confirming, you&apos;ll receive a receipt to share with us.
              </p>

              <form className="space-y-4" onSubmit={handleSubmitOrder}>
                <div>
                  <label className="block text-sm font-semibold text-soft-brown mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Maria Santos"
                    className="w-full rounded-xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-soft-brown mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-soft-brown mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+63 9 XX XXX XXXX"
                    className="w-full rounded-xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-soft-brown mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Street, City, Postal Code"
                    className="w-full rounded-xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none resize-none"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-soft-brown mb-2">
                    Special Instructions (optional)
                  </label>
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Gift wrap, specific colors, delivery instructions..."
                    className="w-full rounded-xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none resize-none"
                    rows={2}
                  />
                </div>

                {/* Error Message */}
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{checkoutError}</p>
                  </div>
                )}

                {/* Order Summary in Modal */}
                <div className="bg-beige/30 rounded-2xl p-4 mt-6">
                  <p className="text-xs text-gray-600 mb-2">Order Total</p>
                  <p className="text-2xl font-bold text-accent-red">{formatCurrency(total)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="flex-1 rounded-full border border-beige/60 px-4 py-3 text-soft-brown font-medium hover:bg-beige/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '⏳ Processing...' : '✓ Confirm Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setLastOrder(null)}
              className="sticky top-4 right-4 float-right text-soft-brown hover:text-accent-red text-2xl transition"
              aria-label="Close receipt"
            >
              ✕
            </button>

            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-3xl font-bold text-soft-brown mb-2">Order Confirmed!</h2>
                <p className="text-gray-600">Thank you for your order!</p>
              </div>

              {/* Order Number and Date */}
              <div className="bg-beige/30 rounded-2xl p-4 mb-6 text-center">
                <p className="text-xs text-gray-600 mb-1">Order ID</p>
                <p className="font-mono text-lg font-bold text-soft-brown break-all">{lastOrder.id}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(lastOrder.created_at).toLocaleString()}
                </p>
              </div>

              {/* Shipping Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-soft-brown mb-3">📍 Shipping Details</h3>
                <div className="bg-white rounded-2xl border border-beige/30 p-4 space-y-2 text-sm">
                  <p><span className="font-medium text-soft-brown">Name:</span> {lastOrder.shipping_address?.name}</p>
                  <p><span className="font-medium text-soft-brown">Email:</span> {lastOrder.email}</p>
                  <p><span className="font-medium text-soft-brown">Contact:</span> {lastOrder.shipping_address?.phone}</p>
                  <p><span className="font-medium text-soft-brown">Address:</span> {lastOrder.shipping_address?.address}</p>
                  {lastOrder.notes && (
                    <p><span className="font-medium text-soft-brown">Notes:</span> {lastOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-soft-brown mb-3">📦 Your Items</h3>
                <div className="bg-white rounded-2xl border border-beige/30 p-4 space-y-3">
                  {Array.isArray(lastOrder.items) &&
                    lastOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-3 border-b border-beige/20 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-medium text-soft-brown">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-accent-red">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-accent-red/10 to-muted-pink/10 rounded-2xl p-4 mb-6 border border-beige/30">
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(lastOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatCurrency(lastOrder.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(lastOrder.tax)}</span>
                  </div>
                </div>
                <div className="border-t border-beige/30 pt-3 flex justify-between">
                  <span className="font-bold text-soft-brown">Total</span>
                  <span className="text-2xl font-bold text-accent-red">{formatCurrency(lastOrder.total)}</span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
                <p className="font-semibold text-soft-brown mb-3">📱 Next Step: Send Receipt</p>
                <p className="text-sm text-gray-700 mb-4">
                  Please take a screenshot of this receipt and send it to our Facebook page so we can confirm and process your order.
                </p>
                {facebookUrl && facebookUrl !== '#' && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-accent-red text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition"
                  >
                    💬 Message on Facebook
                  </a>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="w-full btn-secondary py-3 rounded-full font-medium"
              >
                ← Back to Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
