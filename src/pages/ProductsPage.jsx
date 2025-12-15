import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import formatCurrency from '../utils/formatCurrency';
import { getProducts } from '../services/productService';
import { addReview as addProductReviewApi } from '../services/reviewService';

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('featured');
  const [newOnly, setNewOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });

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
    return ['All', ...Array.from(unique)];
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

    switch (sortOption) {
      case 'price-asc':
        list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'newest':
        list = [...list].sort((a, b) => (b.isNew === a.isNew ? 0 : b.isNew ? 1 : -1));
        break;
      default:
        list = [...list];
    }
    return list;
  }, [products, selectedCategory, newOnly, priceRange, priceBounds, sortOption]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setReviewForm({ name: '', rating: 5, comment: '' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !reviewForm.comment.trim()) return;
    try {
      await addProductReviewApi({
        product_id: selectedProduct.id,
        name: reviewForm.name || 'Guest',
        rating: Number(reviewForm.rating) || 5,
        comment: reviewForm.comment,
      });
      // Optional: Notify user and clear form
      setReviewForm({ name: '', rating: 5, comment: '' });
      // For simplicity, not fetching reviews list in this page; you can extend by loading reviews per product.
    } catch (err) {
      // No-op: errors are handled in service; consider surfacing a toast/UI message
      console.error('Failed to submit review', err);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-soft-brown mb-8">
          Our Products
        </h1>

        {loading && (
          <div className="text-center py-12 text-soft-brown">Loading products…</div>
        )}
        {error && (
          <div className="text-center py-12 text-red-600">{String(error)}</div>
        )}

        {!loading && !error && (
          <>
            {/* Category Filter */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-accent-red text-white'
                        : 'text-soft-brown hover:bg-muted-pink'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <label className="text-sm font-medium text-soft-brown">
                  Sort by
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">New arrivals</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-soft-brown">
                  Min Price
                  <input
                    type="number"
                    value={priceRange.min}
                    placeholder={priceBounds.min.toString()}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                  />
                </label>
                <label className="text-sm font-medium text-soft-brown">
                  Max Price
                  <input
                    type="number"
                    value={priceRange.max}
                    placeholder={priceBounds.max.toString()}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-soft-brown">
                  <input
                    type="checkbox"
                    checked={newOnly}
                    onChange={(e) => setNewOnly(e.target.checked)}
                    className="rounded border-muted-pink text-accent-red"
                  />
                  Show only new arrivals
                </label>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl-grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="relative group">
                  {product.stock !== undefined && (
                    <span className="absolute top-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-soft-brown shadow">
                      Stock: {product.stock}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openProduct(product)}
                    className="absolute top-3 right-3 z-10 rounded-full border border-soft-brown/20 bg-white px-3 py-1 text-xs font-semibold text-soft-brown shadow opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
                    aria-label={`View details for ${product.name}`}
                  >
                    View
                  </button>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red"
              aria-label="Close product details"
            >
              ✕
            </button>
            <div className="grid gap-8 md:grid-cols-2 p-8">
              <div className="space-y-4">
                <img
                  src={
                    (selectedProduct.gallery?.length
                      ? [selectedProduct.image, ...selectedProduct.gallery.filter(Boolean)]
                      : [selectedProduct.image]
                    )[activeImageIndex] || 'https://via.placeholder.com/600x400/F5E6D3/8B4513?text=Whimsical+By+Achlys'
                  }
                  alt={selectedProduct.name}
                  className="w-full rounded-3xl object-cover"
                />
                <div className="grid grid-cols-4 gap-3">
                  {[selectedProduct.image, ...(selectedProduct.gallery || [])]
                    .filter(Boolean)
                    .map((img, idx) => (
                      <button
                        key={img + idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`rounded-2xl overflow-hidden border ${
                          activeImageIndex === idx ? 'border-accent-red' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="Alternate view" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                </div>
                <div className="flex gap-3 text-xs font-semibold">
                  {selectedProduct.isNew && (
                    <span className="rounded-full bg-accent-red/15 px-3 py-1 text-accent-red">New arrival</span>
                  )}
                  {selectedProduct.stock !== undefined && (
                    <span className="rounded-full bg-muted-pink/20 px-3 py-1 text-soft-brown">Stock: {selectedProduct.stock}</span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="uppercase tracking-[0.4em] text-xs text-soft-brown/70">{selectedProduct.category}</p>
                  <h3 className="text-3xl font-bold text-soft-brown">{selectedProduct.name}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                <p className="text-3xl font-bold text-accent-red">{formatCurrency(selectedProduct.price)}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="btn-primary flex-1"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
                <div className="pt-4 border-t space-y-3 max-h-60 overflow-y-auto">
                  <p className="text-sm font-semibold text-soft-brown">Customer Reviews</p>
                  {(selectedProduct.reviews?.length ? selectedProduct.reviews : [{ id: 'empty', name: 'No reviews yet', rating: 0, comment: 'Be the first to leave a review!' }]).map((review) => (
                    <div key={review.id} className="rounded-2xl bg-beige/40 p-3 text-left">
                      <div className="flex items-center justify-between text-xs text-soft-brown">
                        <span>{review.name}</span>
                        <span>{'★'.repeat(review.rating || 0).padEnd(5, '☆')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  ))}
                  <form onSubmit={handleReviewSubmit} className="space-y-2 rounded-2xl border border-beige/60 p-3 text-left bg-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-soft-brown/70">Leave a review</p>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name (optional)"
                      className="w-full rounded-xl border border-beige/60 px-3 py-2 text-sm"
                    />
                    <label className="flex items-center gap-3 text-sm text-soft-brown">
                      Rating
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                        className="rounded-xl border border-beige/60 px-2 py-1"
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
                      className="w-full rounded-xl border border-beige/60 px-3 py-2 text-sm"
                      rows={3}
                      required
                    />
                    <button type="submit" className="btn-secondary w-full">Submit Review</button>
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
