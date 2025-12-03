import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import formatCurrency from '../utils/formatCurrency';
import showToast from '../utils/toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = (product.stock ?? Infinity) <= 0;
  const [imageError, setImageError] = useState(false);
  
  // Validate image URL - ensure it's a complete URL
  const getImageUrl = () => {
    const fallback = 'https://via.placeholder.com/400x300/F5E6D3/8B4513?text=Whimsical+By+Achlys';
    let imageUrl = product.image || fallback;
    
    // Check if URL is valid (must start with http://, https://, or /)
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
      console.warn('Invalid image URL detected:', imageUrl);
      return fallback;
    }
    
    return imageUrl;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('This item is out of stock', 'error');
      return;
    }

    const result = addToCart(product);
    if (!result || !result.ok) {
      showToast(result?.message || 'Unable to add item to cart. It may be out of stock.', 'error');
      return;
    }

    showToast('Added to cart', 'success');
  };

  const handleImageError = () => {
    console.warn('Failed to load product image:', product.image);
    setImageError(true);
  };

  return (
    <div className="card transition-transform duration-200 hover:-translate-y-1">
      <div className="relative">
        <img
          src={imageError ? 'https://via.placeholder.com/400x300/F5E6D3/8B4513?text=Whimsical+By+Achlys' : getImageUrl()}
          alt={product.name}
          className="w-full h-64 object-cover"
          loading="lazy"
          onError={handleImageError}
        />
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          {/* Out of Stock - left */}
          {isOutOfStock && (
            <span className="rounded-full bg-gray-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
              Out of Stock
            </span>
          )}
          
          {/* New Arrival - right */}
          {product.is_new && !isOutOfStock && (
            <span className="rounded-full bg-accent-red/90 px-3 py-1 text-xs font-semibold text-white shadow ml-auto">
              New
            </span>
          )}
          {product.is_new && isOutOfStock && (
            <span className="rounded-full bg-accent-red/90 px-3 py-1 text-xs font-semibold text-white shadow">
              New
            </span>
          )}
        </div>

        {/* Bottom badges */}
        {(product.is_limited_stock || product.is_featured || product.is_on_sale) && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            {product.is_limited_stock && (
              <span className="rounded-full bg-orange-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                Limited Stocks
              </span>
            )}
            {product.is_featured && (
              <span className="rounded-full bg-purple-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                Featured
              </span>
            )}
            {product.is_on_sale && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                On Sale
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-soft-brown/70">{product.category}</p>
          <h3 className="text-base sm:text-lg font-semibold text-soft-brown line-clamp-2">{product.name}</h3>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xl sm:text-2xl font-bold text-accent-red">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-full border border-accent-red/30 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold transition active:scale-95 ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-accent-red hover:bg-accent-red hover:text-white'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
