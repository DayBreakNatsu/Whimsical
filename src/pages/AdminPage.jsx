import React, { useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { uploadImage, deleteImage, deleteMultipleImages, listImages, getStorageStats, clearStorage } from '../services/storageService';
import {
  createProduct as createProductApi,
  deleteProduct as deleteProductApi,
} from '../services/productService';
import { getAllOrders } from '../services/orderService';
import { signIn, signOut as supaSignOut, isAdmin } from '../services/authService';

const AUTH_KEY = 'whimsical-admin-auth';

const TextField = ({ label, value, onChange, textarea }) => (
  <label className="block text-sm font-medium text-soft-brown">
    <span>{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
        rows={3}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
      />
    )}
  </label>
);

const AdminPage = () => {
  const { content, updateContent, updateNestedItem, addProduct, updateProduct, removeProduct, resetContent } = useSiteContent();
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [formError, setFormError] = useState('');
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  // Product editing state managed via showProductModal state
  const [productSearch, setProductSearch] = useState('');
  const [uploadingImages, setUploadingImages] = useState({});
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    gallery: ['', '', ''],
    category: 'Bouquet',
    isNew: false,
    isLimitedStock: false,
    isFeatured: false,
    isOnSale: false,
    stock: '',
  });
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibraryTarget, setImageLibraryTarget] = useState({ type: null, productId: null });
  const [imageLibrary, setImageLibrary] = useState({ loading: false, images: [], error: '' });
  const [ordersState, setOrdersState] = useState({ loading: false, error: '', items: [] });
  const [storageStats, setStorageStats] = useState({ files: 0, totalSize: 0, sizeInMB: 0 });
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageClearConfirm, setStorageClearConfirm] = useState(false);
  const [storageError, setStorageError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Map username to email for Supabase
    let email = username;
    if (username && username.trim().toLowerCase() === 'admin') {
      email = 'admin@whimsical.local';
    }
    // Allow direct email use as fallback
    if (!email.includes('@')) {
      // If user typed a non-email other than Admin, reject
      setLoginError('Invalid username. Use Admin or a valid email.');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setLoginError(error.error || 'Login failed.');
      return;
    }

    const admin = await isAdmin();
    if (!admin) {
      setLoginError('Not authorized. Admin role required.');
      await supaSignOut();
      return;
    }

    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthed(true);
    setPassword('');
  };

  const handleLogout = async () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthed(false);
    try {
      await supaSignOut();
    } catch {
      // TODO: Implement delete product functionality
    }
  };

  // Load storage stats
  const loadStorageStats = async () => {
    setStorageLoading(true);
    setStorageError('');
    const { data, error } = await getStorageStats('products');
    if (error) {
      setStorageError(error.message || 'Failed to load storage stats.');
    } else {
      setStorageStats(data || { files: 0, totalSize: 0, sizeInMB: 0 });
    }
    setStorageLoading(false);
  };

  // Clear all storage
  const handleClearStorage = async () => {
    setStorageError('');
    setStorageLoading(true);
    const { deletedCount, error } = await clearStorage('products');
    if (error) {
      setStorageError(error.message || 'Failed to clear storage.');
    } else {
      setStorageError('');
      // Show confirmation message
      alert(`Successfully deleted ${deletedCount} files from storage.`);
      await loadStorageStats();
    }
    setStorageLoading(false);
    setStorageClearConfirm(false);
  };

  // Load storage stats on mount
  React.useEffect(() => {
    if (isAuthed) {
      loadStorageStats();
    }
  }, [isAuthed]);

  // Load orders for admin view
  React.useEffect(() => {
    const loadOrders = async () => {
      setOrdersState((prev) => ({ ...prev, loading: true, error: '' }));
      const { data, error } = await getAllOrders();
      if (error) {
        setOrdersState({ loading: false, error: error.error || 'Failed to load orders.', items: [] });
      } else {
        setOrdersState({ loading: false, error: '', items: data || [] });
      }
    };

    loadOrders();
  }, []);

  const handleNewProductChange = (field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openImageLibrary = async (target) => {
    setImageLibraryTarget(target);
    setShowImageLibrary(true);
    setImageLibrary((prev) => ({ ...prev, loading: true, error: '', images: [] }));

    const { data, error } = await listImages('products');
    if (error) {
      setImageLibrary({ loading: false, images: [], error: error.error || 'Failed to load images.' });
    } else {
      setImageLibrary({ loading: false, images: data || [], error: '' });
    }
  };

  const handleSelectLibraryImage = (url) => {
    if (!imageLibraryTarget?.type) return;

    if (imageLibraryTarget.type === 'new') {
      setNewProduct((prev) => ({ ...prev, image: url }));
    } else if (imageLibraryTarget.type === 'existing' && imageLibraryTarget.productId) {
      updateProduct(imageLibraryTarget.productId, { image: url });
    }

    setShowImageLibrary(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!newProduct.name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    setFormError('');

    // Map local state to Supabase column names
    const supabaseProduct = {
      name: newProduct.name.trim(),
      description: newProduct.description || '',
      price: Number(newProduct.price) || 0,
      image: newProduct.image || null,
      gallery: Array.isArray(newProduct.gallery)
        ? newProduct.gallery.filter(Boolean)
        : [],
      category: newProduct.category || 'Bouquet',
      is_new: newProduct.isNew,
      is_limited_stock: newProduct.isLimitedStock,
      is_featured: newProduct.isFeatured,
      is_on_sale: newProduct.isOnSale,
      stock: Number(newProduct.stock) || 0,
    };

    const { data, error } = await createProductApi(supabaseProduct);

    if (error) {
      setFormError(error.error || 'Failed to save product to Supabase.');
      return;
    }

    // Keep local content in sync for the storefront / Admin UI
    addProduct({
      ...newProduct,
      id: data?.id,
      price: supabaseProduct.price,
      stock: supabaseProduct.stock,
    });

    setNewProduct({
      name: '',
      description: '',
      price: '',
      image: '',
      gallery: ['', '', ''],
      category: 'Bouquet',
      isNew: false,
      isLimitedStock: false,
      isFeatured: false,
      isOnSale: false,
      stock: '',
    });
    setShowAddPanel(false);
  };

  const handleImageUpload = async (file, onSuccess, uploadKey = 'default') => {
    if (!file) return;
    
    // Set uploading state
    setUploadingImages((prev) => ({ ...prev, [uploadKey]: true }));
    
    try {
      // Upload to Supabase Storage
      const { data: imageUrl, error } = await uploadImage(file, 'products');
      
      if (error) {
        console.error('Image upload error:', error);
        setFormError(`Failed to upload image: ${error.error || 'Unknown error'}`);
        return;
      }
      
      // Call success callback with the public URL
      if (onSuccess && imageUrl) {
        onSuccess(imageUrl);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setFormError(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleNewProductGalleryChange = (index, value) => {
    setNewProduct((prev) => {
      const gallery = [...prev.gallery];
      gallery[index] = value;
      return { ...prev, gallery };
    });
  };

  const handleEditProduct = () => {
    // Product editing state would be managed via setShowAddPanel and form state
    setShowAddPanel(true);
  };

  // Gallery upload and change handling deferred for future enhancement
  // const handleProductGalleryChange = (productId, index, value) => {
  // const product = products.find((item) => item.id === productId);
  // const gallery = Array.isArray(product?.gallery) ? [...product.gallery] : [...emptyGallery];
  // gallery[index] = value;
  // updateProduct(productId, { gallery });
  // };

  // Gallery upload deferred for future enhancement

  if (!isAuthed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-4">
          <h1 className="text-2xl font-semibold text-soft-brown text-center">Admin Login</h1>
          <p className="text-sm text-gray-500 text-center">Sign in to manage products and orders.</p>
          <label className="block text-sm font-medium text-soft-brown">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-beige/60 px-4 py-3 focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
              placeholder="Admin"
            />
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-beige/60 px-4 py-3 pr-12 focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-soft-brown text-sm"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
          <button type="submit" className="btn-primary w-full">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  const { hero, about, socials, general } = content;
  const products = content.products || [];
  const totalProducts = products.length;
  const lowStockCount = products.filter((product) => Number(product.stock) <= 5).length;
  const newArrivalCount = products.filter((product) => product.isNew).length;
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="bg-white rounded-3xl shadow-lg border border-beige/60 p-6 lg:sticky lg:top-24 h-fit">
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Dashboard</p>
          <h1 className="text-2xl font-bold text-soft-brown mb-4">Content Editor</h1>
          <nav className="space-y-2 text-sm font-medium text-soft-brown">
            {[
              ['hero', 'Hero Banner'],
              ['about', 'About Story'],
              ['inventory', 'Inventory'],
              ['orders', 'Orders'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={`#${href}`}
                className="block rounded-2xl border border-transparent px-3 py-2 hover:border-muted-pink hover:bg-muted-pink/20"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-6 space-y-3">
            <button
              onClick={resetContent}
              className="w-full rounded-full border border-beige/80 px-4 py-2 text-sm text-soft-brown hover:bg-beige/40"
            >
              Reset Defaults
            </button>
            <button onClick={handleLogout} className="w-full rounded-full bg-gray-800 px-4 py-2 text-sm text-white">
              Log out
            </button>
          </div>
        </aside>

        <div className="space-y-10">
      <section id="hero" className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Hero</p>
          <h2 className="text-2xl font-semibold text-soft-brown">Hero Banner</h2>
        </div>
        <div className="grid gap-4">
          <TextField label="Tagline" value={hero.tagline} onChange={(value) => updateContent('hero', { tagline: value })} />
          <TextField label="Heading" value={hero.heading} onChange={(value) => updateContent('hero', { heading: value })} />
          <TextField
            label="Description"
            value={hero.description}
            onChange={(value) => updateContent('hero', { description: value })}
            textarea
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-soft-brown mb-4">Stats</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {hero.stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="rounded-2xl border border-beige/60 p-4 space-y-3">
                <TextField
                  label="Value"
                  value={stat.value}
                  onChange={(value) => updateNestedItem('hero', 'stats', index, 'value', value)}
                />
                <TextField
                  label="Label"
                  value={stat.label}
                  onChange={(value) => updateNestedItem('hero', 'stats', index, 'label', value)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">General</p>
          <h2 className="text-2xl font-semibold text-soft-brown">Shop Settings</h2>
          <p className="text-sm text-gray-500">Control shipping fees and tax rates applied at checkout.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Flat Shipping Fee (PHP)"
            value={general?.shippingFee ?? 0}
            onChange={(value) => updateContent('general', { shippingFee: Number(value) || 0 })}
          />
          <TextField
            label="Tax Rate (e.g., 0.08 for 8%)"
            value={general?.taxRate ?? 0}
            onChange={(value) => updateContent('general', { taxRate: Number(value) || 0 })}
          />
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Socials</p>
          <h2 className="text-2xl font-semibold text-soft-brown">Social Links</h2>
          <p className="text-sm text-gray-500">Update the links used across the site.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['facebook', 'Facebook'],
            ['instagram', 'Instagram'],
            ['tiktok', 'TikTok'],
          ].map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              value={socials?.[key] || ''}
              onChange={(value) => updateContent('socials', { [key]: value })}
            />
          ))}
        </div>
      </section>

      <section id="about" className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Story</p>
          <h2 className="text-2xl font-semibold text-soft-brown">About Section</h2>
        </div>
        <div className="grid gap-4">
          <TextField label="Heading" value={about.heading} onChange={(value) => updateContent('about', { heading: value })} />
          <TextField
            label="Description"
            value={about.description}
            onChange={(value) => updateContent('about', { description: value })}
            textarea
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-soft-brown mb-4">Highlights</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {about.highlights.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-beige/60 p-4 space-y-3">
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateNestedItem('about', 'highlights', index, 'title', value)}
                />
                <TextField
                  label="Detail"
                  value={item.detail}
                  onChange={(value) => updateNestedItem('about', 'highlights', index, 'detail', value)}
                  textarea
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-soft-brown mb-4">Pillars</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {about.pillars.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-beige/60 p-4 space-y-3">
                <TextField
                  label="Icon"
                  value={item.icon}
                  onChange={(value) => updateNestedItem('about', 'pillars', index, 'icon', value)}
                />
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateNestedItem('about', 'pillars', index, 'title', value)}
                />
                <TextField
                  label="Detail"
                  value={item.detail}
                  onChange={(value) => updateNestedItem('about', 'pillars', index, 'detail', value)}
                  textarea
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="inventory" className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Inventory</p>
          <h2 className="text-2xl font-semibold text-soft-brown">Product Catalog</h2>
          <p className="text-sm text-gray-500">Add, edit, or remove bouquets and keychains.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Products', value: totalProducts },
            { label: 'Low Stock (≤5)', value: lowStockCount, highlight: lowStockCount > 0 },
            { label: 'New Arrivals', value: newArrivalCount },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`rounded-2xl border px-4 py-3 ${highlight ? 'border-accent-red/40 bg-accent-red/5' : 'border-beige/60 bg-beige/20'}`}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-soft-brown/70">{label}</p>
              <p className="text-3xl font-bold text-soft-brown mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <label className="flex-1 text-sm font-medium text-soft-brown">
            <span className="sr-only">Search inventory</span>
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Quick search by name or category"
              className="w-full rounded-2xl border border-beige/70 bg-white/80 px-4 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
            />
          </label>
          <button
            onClick={() => setShowAddPanel(true)}
            className="inline-flex items-center justify-center rounded-full bg-accent-red px-6 py-3 text-white font-semibold shadow-md hover:-translate-y-0.5 transition"
          >
            + Add Product
          </button>
        </div>

        <div className="mt-6">
          {filteredProducts.length === 0 && <p className="text-sm text-gray-500">No products match your search.</p>}
          <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-beige/40">
            <table className="min-w-full divide-y divide-beige/40">
              <thead className="bg-muted-pink/20">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Image</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">New</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-soft-brown/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-beige/30">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted-pink/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded-lg border border-beige/40" loading="lazy" />
                      ) : (
                        <div className="h-12 w-12 bg-beige/20 rounded-lg border border-beige/40 flex items-center justify-center">
                          <span className="text-xs text-soft-brown/60">No img</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-soft-brown">{product.name || 'Untitled product'}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={product.category}
                        onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                        className="text-sm rounded-lg border border-beige/60 bg-white/80 px-2 py-1 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30"
                      >
                        <option value="Bouquet">Bouquet</option>
                        <option value="Keychain">Keychain</option>
                        <option value="Accessory">Accessory</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                        className="text-sm w-24 rounded-lg border border-beige/60 bg-white/80 px-2 py-1 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => updateProduct(product.id, { stock: e.target.value })}
                        className={`text-sm w-16 rounded-lg border bg-white/80 px-2 py-1 text-gray-700 shadow-sm focus:ring-1 focus:ring-accent-red/30 ${
                          Number(product.stock) <= 5 
                            ? 'border-accent-red/40 focus:border-accent-red' 
                            : 'border-beige/60 focus:border-accent-red'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={product.isNew}
                          onChange={(e) => updateProduct(product.id, { isNew: e.target.checked })}
                          className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-xs text-accent-red hover:text-accent-red/80 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              const imagePaths = [
                                product.image,
                                ...(Array.isArray(product.gallery) ? product.gallery : []),
                              ].filter(Boolean);

                              try {
                                if (imagePaths.length === 1) {
                                  await deleteImage(imagePaths[0]);
                                } else if (imagePaths.length > 1) {
                                  await deleteMultipleImages(imagePaths);
                                }
                              } catch (err) {
                                console.warn('Failed to delete some product images', err);
                              }

                              if (product.id) {
                                try {
                                  await deleteProductApi(product.id);
                                } catch (err) {
                                  console.warn('Failed to delete product from Supabase', err);
                                }
                              }

                              removeProduct(product.id);
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="orders" className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Orders</p>
          <h2 className="text-2xl font-semibold text-soft-brown">Recent Orders</h2>
          <p className="text-sm text-gray-500">Guest and customer orders placed from the checkout page.</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-soft-brown">
              {ordersState.items.length} total orders
            </span>
            <span className="text-sm text-muted-pink">
              {ordersState.items.filter(order => order.status === 'pending').length} pending
            </span>
          </div>
          <a
            href="/orders"
            className="inline-flex items-center rounded-full bg-accent-red px-4 py-2 text-sm text-white font-semibold shadow-md hover:-translate-y-0.5 transition"
          >
            View Detailed Orders
          </a>
        </div>
        {ordersState.error && (
          <p className="text-sm text-red-500">{ordersState.error}</p>
        )}
        {ordersState.loading ? (
          <p className="text-sm text-soft-brown">Loading orders...</p>
        ) : ordersState.items.length === 0 ? (
          <p className="text-sm text-gray-500">No orders have been placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-beige/60 text-left text-xs uppercase tracking-[0.2em] text-soft-brown/70">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Order ID</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersState.items.map((order) => (
                  <tr key={order.id} className="border-b border-beige/40 last:border-b-0">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-600 break-all max-w-[160px]">
                      {order.id}
                    </td>
                    <td className="py-2 pr-4">
                      {order.shipping_address?.name || 'Guest'}
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-600 break-all max-w-[180px]">
                      {order.email}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      ₱{Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full bg-muted-pink/30 px-3 py-1 text-xs font-medium text-soft-brown">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="storage" className="bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-beige/50">
        <h2 className="text-2xl font-semibold text-soft-brown">Storage Management</h2>
        
        <div className="rounded-lg bg-beige/20 border border-beige/40 p-4">
          <p className="text-sm text-gray-700">
            <strong>📦 Supabase Free Tier:</strong> 1 GB per project | 
            <strong> Current Usage:</strong> {storageStats.sizeInGB} GB / 1 GB
          </p>
          {storageStats.usageWarning && (
            <p className="text-sm text-amber-700 mt-2">
              ⚠️ <strong>{storageStats.usageWarning}</strong> — Consider clearing unused files.
            </p>
          )}
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-muted-pink/20 to-beige/20 p-4 space-y-2">
            <p className="text-sm font-medium text-soft-brown/70">Total Files</p>
            <p className="text-3xl font-bold text-soft-brown">{storageStats.files}</p>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-accent-red/10 to-beige/20 p-4 space-y-2">
            <p className="text-sm font-medium text-soft-brown/70">Storage Used</p>
            <p className="text-2xl font-bold text-soft-brown">{storageStats.sizeInMB} <span className="text-lg">MB</span></p>
            <p className="text-xs text-gray-600">{storageStats.sizeInGB} GB</p>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-beige/30 to-beige/10 p-4 space-y-2">
            <p className="text-sm font-medium text-soft-brown/70">Bucket Limit</p>
            <p className="text-2xl font-bold text-soft-brown">1 <span className="text-lg">GB</span></p>
            <p className="text-xs text-gray-600">Free tier quota</p>
          </div>
        </div>

        {storageError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{storageError}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={loadStorageStats}
            disabled={storageLoading}
            className="inline-flex items-center gap-2 rounded-full bg-accent-red/10 text-accent-red px-4 py-2 text-sm font-semibold hover:bg-accent-red/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {storageLoading ? 'Refreshing...' : 'Refresh Stats'}
          </button>

          <div className="pt-4 border-t border-beige/40">
            <h3 className="font-semibold text-soft-brown mb-3">Clear Storage</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete all product images from storage. This action cannot be undone.
            </p>
            
            {!storageClearConfirm ? (
              <button
                onClick={() => setStorageClearConfirm(true)}
                disabled={storageLoading || storageStats.files === 0}
                className="rounded-full bg-red-500 text-white px-4 py-2 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete All Files ({storageStats.files})
              </button>
            ) : (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Are you sure? This will permanently delete {storageStats.files} file(s) ({storageStats.sizeInMB} MB).
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClearStorage}
                    disabled={storageLoading}
                    className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {storageLoading ? 'Deleting...' : 'Yes, Delete All'}
                  </button>
                  <button
                    onClick={() => setStorageClearConfirm(false)}
                    disabled={storageLoading}
                    className="rounded-full border border-red-200 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
        </div>
      </div>

      {showAddPanel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddPanel(false)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red"
              aria-label="Close add product dialog"
            >
              ✕
            </button>
            <h3 className="text-2xl font-semibold text-soft-brown mb-4">Add New Product</h3>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddProduct}>
              <TextField label="Name" value={newProduct.name} onChange={(value) => handleNewProductChange('name', value)} />
              <TextField
                label="Price"
                value={newProduct.price}
                onChange={(value) => handleNewProductChange('price', value)}
              />
              <TextField
                label="Image URL"
                value={newProduct.image}
                onChange={(value) => handleNewProductChange('image', value)}
              />
              <label className="text-sm font-medium text-soft-brown">
                <span>Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], (data) => handleNewProductChange('image', data), 'new-product-image')}
                  disabled={uploadingImages['new-product-image']}
                  className="mt-1 w-full rounded-xl border border-dashed border-beige/70 bg-white/50 px-3 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploadingImages['new-product-image'] && (
                  <p className="text-xs text-soft-brown/70 mt-1">Uploading...</p>
                )}
                <button
                  type="button"
                  onClick={() => openImageLibrary({ type: 'new', productId: null })}
                  className="mt-2 inline-flex items-center text-xs text-soft-brown hover:text-accent-red"
                >
                  Browse library
                </button>
              </label>
              <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                {new Array(3).fill(0).map((_, index) => (
                  <label key={index} className="text-sm font-medium text-soft-brown">
                    <span>Gallery {index + 1}</span>
                    <input
                      type="text"
                      value={newProduct.gallery?.[index] || ''}
                      onChange={(e) => handleNewProductGalleryChange(index, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], (data) => handleNewProductGalleryChange(index, data), `new-product-gallery-${index}`)}
                      disabled={uploadingImages[`new-product-gallery-${index}`]}
                      className="mt-1 w-full rounded-xl border border-dashed border-beige/70 bg-white/50 px-3 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {uploadingImages[`new-product-gallery-${index}`] && (
                      <p className="text-xs text-soft-brown/70 mt-1">Uploading...</p>
                    )}
                  </label>
                ))}
              </div>
              <TextField label="Stock" value={newProduct.stock} onChange={(value) => handleNewProductChange('stock', value)} />
              <label className="text-sm font-medium text-soft-brown">
                <span>Category</span>
                <select
                  value={newProduct.category}
                  onChange={(e) => handleNewProductChange('category', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                >
                  <option value="Bouquet">Bouquet</option>
                  <option value="Keychain">Keychain</option>
                  <option value="Accessory">Accessory</option>
                </select>
              </label>
              <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-medium text-soft-brown">
                  <input
                    type="checkbox"
                    checked={newProduct.isNew}
                    onChange={(e) => handleNewProductChange('isNew', e.target.checked)}
                    className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40"
                  />
                  New Arrival
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-soft-brown">
                  <input
                    type="checkbox"
                    checked={newProduct.isLimitedStock}
                    onChange={(e) => handleNewProductChange('isLimitedStock', e.target.checked)}
                    className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40"
                  />
                  Limited Stocks Only
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-soft-brown">
                  <input
                    type="checkbox"
                    checked={newProduct.isFeatured}
                    onChange={(e) => handleNewProductChange('isFeatured', e.target.checked)}
                    className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-soft-brown">
                  <input
                    type="checkbox"
                    checked={newProduct.isOnSale}
                    onChange={(e) => handleNewProductChange('isOnSale', e.target.checked)}
                    className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40"
                  />
                  On Sale
                </label>
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="Description"
                  value={newProduct.description}
                  onChange={(value) => handleNewProductChange('description', value)}
                  textarea
                />
              </div>
              {formError && <p className="text-sm text-red-500 md:col-span-2">{formError}</p>}
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddPanel(false)} className="rounded-full border border-beige/60 px-4 py-2 text-soft-brown">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl relative max-h-[80vh] overflow-hidden flex flex-col">
            <button
              onClick={() => setShowImageLibrary(false)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red"
              aria-label="Close image library"
            >
              ✕
            </button>
            <h3 className="text-2xl font-semibold text-soft-brown mb-4 pr-8">Image Library</h3>
            {imageLibrary.error && (
              <p className="text-sm text-red-500 mb-3">{imageLibrary.error}</p>
            )}
            {imageLibrary.loading ? (
              <p className="text-sm text-soft-brown">Loading images...</p>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {imageLibrary.images.length === 0 ? (
                  <p className="text-sm text-gray-500">No images found in storage yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageLibrary.images.map((url) => (
                      <button
                        type="button"
                        key={url}
                        onClick={() => handleSelectLibraryImage(url)}
                        className="group rounded-2xl border border-beige/60 overflow-hidden hover:border-accent-red focus:outline-none focus:ring-2 focus:ring-accent-red/40"
                      >
                        <img
                          src={url}
                          alt="Product"
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImageLibrary(false)}
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

export default AdminPage;
