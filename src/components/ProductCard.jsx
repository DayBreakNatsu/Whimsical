import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import formatCurrency from '../utils/formatCurrency';
import showToast from '../utils/toast';
import validateImageUrl from '../utils/validateImageUrl';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = (product.stock ?? Infinity) <= 0;
  const [imageError, setImageError] = useState(false);
  
  // Validate image URL - ensure it's a complete URL
  const getImageUrl = () => {
    const fallback = 'https://via.placeholder.com/400x300/F5E6D3/8B4513?text=Whimsical+By+Achlys';
    const imageUrl = product.image || fallback;
    return validateImageUrl(imageUrl, fallback);
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
    <div className="bg-white rounded-2xl overflow-hidden border border-beige/30 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={imageError ? 'https://via.placeholder.com/600x420/F5E6D3/8B4513?text=Whimsical+By+Achlys' : getImageUrl()}
          alt={product.name}
          className="w-full h-56 md:h-64 lg:h-64 object-cover"
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
          {(product.isNew ?? product.is_new) && !isOutOfStock && (
            <span className="rounded-full bg-accent-red/90 px-3 py-1 text-xs font-semibold text-white shadow ml-auto">
              New
            </span>
          )}
          {(product.isNew ?? product.is_new) && isOutOfStock && (
            <span className="rounded-full bg-accent-red/90 px-3 py-1 text-xs font-semibold text-white shadow">
              New
            </span>
          )}
        </div>

        {/* Bottom badges */}
        {((product.isLimitedStock ?? product.is_limited_stock) || (product.isFeatured ?? product.is_featured) || (product.isOnSale ?? product.is_on_sale)) && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            {(product.isLimitedStock ?? product.is_limited_stock) && (
              <span className="rounded-full bg-orange-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                Limited Stocks
              </span>
            )}
            {(product.isFeatured ?? product.is_featured) && (
              <span className="rounded-full bg-purple-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                Featured
              </span>
            )}
            {(product.isOnSale ?? product.is_on_sale) && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-1 text-xs font-semibold text-white shadow">
                On Sale
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-3 min-h-[140px] flex flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-soft-brown/70">{product.category}</p>
          <h3 className="text-lg font-semibold text-soft-brown line-clamp-2 mt-1">{product.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">{product.description}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3">
          <span className="text-xl sm:text-2xl font-bold text-accent-red">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-full border border-accent-red/30 px-4 py-2 text-sm font-semibold transition active:scale-95 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                : 'text-white bg-accent-red hover:bg-red-700'
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
