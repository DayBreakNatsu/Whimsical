import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import formatCurrency from '../utils/formatCurrency';
import showToast from '../utils/toast';
import { getProducts } from '../services/productService';
import { addReview as addProductReviewApi } from '../services/reviewService';

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('featured');
  const [newOnly, setNewOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await getProducts();
      if (!isMounted) return;
      if (error) {
        setError(error?.message || 'Failed to load products');
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category).filter(Boolean));
    return ['All', ...Array.from(unique).sort()];
  }, [products]);

  const priceBounds = useMemo(() => {
    const values = products.map((p) => Number(p.price) || 0);
    return {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((product) =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'All') {
      list = list.filter((product) => product.category === selectedCategory);
    }
    if (newOnly) {
      list = list.filter((product) => product.isNew);
    }
    const min = priceRange.min !== '' ? Number(priceRange.min) : priceBounds.min;
    const max = priceRange.max !== '' ? Number(priceRange.max) : priceBounds.max;
    list = list.filter((product) => {
      const price = Number(product.price) || 0;
      return price >= min && price <= max;
    });

    // Sorting
    switch (sortOption) {
      case 'price-asc':
        list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'newest':
        list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'featured':
        list = [...list].sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
          if (a.isNew !== b.isNew) return b.isNew ? 1 : -1;
          return 0;
        });
        break;
      default:
        list = [...list];
    }
    return list;
  }, [products, selectedCategory, newOnly, priceRange, priceBounds, sortOption, searchQuery]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setReviewForm({ name: '', rating: 5, comment: '' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !reviewForm.comment.trim()) {
      showToast('Please write a review', 'error');
      return;
    }
    
    setReviewSubmitting(true);
    try {
      await addProductReviewApi({
        product_id: selectedProduct.id,
        name: reviewForm.name || 'Guest',
        rating: Number(reviewForm.rating) || 5,
        comment: reviewForm.comment,
      });
      showToast('Review submitted! Thank you!', 'success');
      setReviewForm({ name: '', rating: 5, comment: '' });
    } catch (err) {
      showToast('Failed to submit review', 'error');
      console.error('Failed to submit review', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    const result = addToCart(product);
    if (result?.ok) {
      showToast('Added to cart!', 'success');
      setSelectedProduct(null);
    } else {
      showToast(result?.message || 'Failed to add to cart', 'error');
    }
  };

  return (
    <div className="py-8 bg-gradient-to-b from-beige/20 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="uppercase tracking-[0.5em] text-xs text-soft-brown/70 mb-2">Shop Collection</p>
          <h1 className="text-4xl md:text-5xl font-bold text-soft-brown mb-4">
            Our Products
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handcrafted collection of fuzzy bouquets, keychains, and whimsical accessories.
          </p>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-accent-red border-t-transparent rounded-full"></div>
              <span className="text-soft-brown">Loading products…</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12 bg-red-50 rounded-3xl border border-red-200">
            <p className="text-red-600 font-semibold">{String(error)}</p>
            <Link to="/" className="text-red-500 hover:text-red-700 text-sm mt-2 inline-block">
              ← Back to Home
            </Link>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories, or descriptions..."
                  className="w-full rounded-full border-2 border-beige/50 bg-white/80 px-6 py-3 text-soft-brown placeholder-gray-400 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 outline-none"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-soft-brown/50">🔍</span>
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2">
                  Found <span className="font-semibold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-6 mb-10 bg-white rounded-3xl p-6 shadow-sm border border-beige/30">
              {/* Categories */}
              <div>
                <p className="text-sm font-semibold text-soft-brown mb-4">📁 Categories</p>
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-accent-red text-white shadow-md'
                          : 'bg-beige/40 text-soft-brown hover:bg-beige/60'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid gap-4 md:grid-cols-4 pt-4 border-t border-beige/30">
                <label className="text-sm font-medium text-soft-brown">
                  <span className="block mb-2">⬇️ Sort by</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full rounded-xl border border-beige/70 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-soft-brown">
                  <span className="block mb-2">💰 Min Price</span>
                  <input
                    type="number"
                    value={priceRange.min}
                    placeholder={`₱${priceBounds.min.toFixed(0)}`}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                    }
                    className="w-full rounded-xl border border-beige/70 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                  />
                </label>

                <label className="text-sm font-medium text-soft-brown">
                  <span className="block mb-2">💰 Max Price</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    placeholder={`₱${priceBounds.max.toFixed(0)}`}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                    }
                    className="w-full rounded-xl border border-beige/70 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                  />
                </label>

                <label className="flex items-center justify-center gap-3 text-sm font-medium text-soft-brown rounded-xl bg-beige/20 px-4 py-2 cursor-pointer hover:bg-beige/40 transition">
                  <input
                    type="checkbox"
                    checked={newOnly}
                    onChange={(e) => setNewOnly(e.target.checked)}
                    className="rounded border-muted-pink text-accent-red w-4 h-4 cursor-pointer"
                  />
                  <span>🆕 New Arrivals</span>
                </label>
              </div>

              {/* Clear Filters */}
              {(selectedCategory !== 'All' || newOnly || priceRange.min !== '' || priceRange.max !== '' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setNewOnly(false);
                    setPriceRange({ min: '', max: '' });
                    setSearchQuery('');
                    setSortOption('featured');
                  }}
                  className="text-sm text-accent-red hover:text-accent-red/70 font-medium"
                >
                  ✕ Clear all filters
                </button>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-soft-brown">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className="absolute top-3 right-3 z-20 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-sm font-semibold text-soft-brown shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all hover:bg-white"
                        aria-label={`View details for ${product.name}`}
                      >
                        👁️ View Details
                      </button>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-beige/40">
                <p className="text-gray-500 text-lg mb-4">😢 No products found</p>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setNewOnly(false);
                    setPriceRange({ min: '', max: '' });
                    setSearchQuery('');
                  }}
                  className="text-accent-red hover:text-accent-red/70 font-medium"
                >
                  ← Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="relative w-full sm:max-w-4xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="sticky top-4 right-4 z-10 float-right text-soft-brown hover:text-accent-red text-2xl transition"
              aria-label="Close product details"
            >
              ✕
            </button>

            <div className="grid gap-8 md:grid-cols-2 p-6 sm:p-8">
              {/* Images */}
              <div className="space-y-4">
                <img
                  src={
                    (selectedProduct.gallery?.length
                      ? [selectedProduct.image, ...selectedProduct.gallery.filter(Boolean)]
                      : [selectedProduct.image]
                    )[activeImageIndex] || 'https://via.placeholder.com/600x400/F5E6D3/8B4513?text=Whimsical'
                  }
                  alt={selectedProduct.name}
                  className="w-full rounded-3xl object-cover bg-beige/20"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400/F5E6D3/8B4513?text=Whimsical';
                  }}
                />
                <div className="grid grid-cols-5 gap-2">
                  {[selectedProduct.image, ...(selectedProduct.gallery || [])]
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((img, idx) => (
                      <button
                        key={img + idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`rounded-2xl overflow-hidden border-2 transition ${
                          activeImageIndex === idx ? 'border-accent-red scale-110' : 'border-beige/40'
                        }`}
                      >
                        <img src={img} alt="Alternate view" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                </div>

                {/* Badge Section */}
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.isFeatured && (
                    <span className="rounded-full bg-purple-600/90 px-3 py-1 text-xs font-semibold text-white">⭐ Featured</span>
                  )}
                  {selectedProduct.isNew && (
                    <span className="rounded-full bg-accent-red/90 px-3 py-1 text-xs font-semibold text-white">🆕 New</span>
                  )}
                  {selectedProduct.isOnSale && (
                    <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">🔥 On Sale</span>
                  )}
                  {selectedProduct.isLimitedStock && (
                    <span className="rounded-full bg-orange-600/90 px-3 py-1 text-xs font-semibold text-white">⏰ Limited Stock</span>
                  )}
                  {selectedProduct.isSample && (
                    <span className="rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white">📌 Sample</span>
                  )}
                  {selectedProduct.stock !== undefined && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedProduct.stock <= 0 ? 'bg-gray-400 text-white' : 'bg-green-100 text-green-800'}`}>
                      {selectedProduct.stock <= 0 ? '❌ Out of Stock' : `✓ ${selectedProduct.stock} in stock`}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <p className="uppercase tracking-[0.4em] text-xs text-soft-brown/70 mb-2">
                    {selectedProduct.category}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-soft-brown mb-3">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Price */}
                <div className="pt-4 border-t border-beige/30">
                  <p className="text-4xl font-bold text-accent-red">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={selectedProduct.stock === 0}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedProduct.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>

                {/* Reviews Section */}
                <div className="pt-6 border-t border-beige/30 space-y-4 max-h-80 overflow-y-auto">
                  <p className="text-sm font-semibold text-soft-brown">⭐ Customer Reviews</p>
                  
                  {/* Existing Reviews */}
                  <div className="space-y-3">
                    {(selectedProduct.reviews?.length ? selectedProduct.reviews : []).map((review) => (
                      <div key={review.id} className="rounded-2xl bg-beige/40 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-soft-brown text-sm">{review.name}</span>
                          <span className="text-xs text-accent-red">{'★'.repeat(review.rating || 0).padEnd(5, '☆')}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                    {!selectedProduct.reviews?.length && (
                      <p className="text-sm text-gray-500 text-center py-4">No reviews yet. Be the first!</p>
                    )}
                  </div>

                  {/* Review Form */}
                  <form onSubmit={handleReviewSubmit} className="space-y-3 rounded-2xl border border-beige/60 p-4 bg-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-soft-brown/70 font-semibold">Leave a Review</p>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name (optional)"
                      className="w-full rounded-xl border border-beige/60 px-3 py-2 text-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                    />
                    <label className="flex items-center gap-3 text-sm text-soft-brown">
                      <span>Rating:</span>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                        className="rounded-xl border border-beige/60 px-2 py-1 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((star) => (
                          <option key={star} value={star}>{star} ★</option>
                        ))}
                      </select>
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                      placeholder="What did you love about this item?"
                      className="w-full rounded-xl border border-beige/60 px-3 py-2 text-sm resize-none focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                      rows={3}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={reviewSubmitting}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Submitting...' : '✓ Submit Review'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
