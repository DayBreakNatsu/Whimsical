import React, { useState } from 'react';
import { useSiteContent, defaultContent } from '../context/SiteContentContext';
import { uploadImage, deleteImage, deleteMultipleImages, listImages, getStorageStats, clearStorage } from '../services/storageService';
import {
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
} from '../services/productService';
import { updateSiteSetting } from '../services/siteSettingsService';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../services/orderService';
import { signIn, signOut as supaSignOut, isAdmin, devSignIn } from '../services/authService';

const AUTH_KEY = 'whimsical-admin-auth';

const TextField = ({ label, value, onChange, textarea }) => (
  <label className="block text-sm font-medium text-soft-brown">
    <span>{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg sm:rounded-xl border border-beige/70 bg-white/80 px-3.5 sm:px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30 resize-none"
        rows={3}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg sm:rounded-xl border border-beige/70 bg-white/80 px-3.5 sm:px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
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
  const [isAuthed, setIsAuthed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
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
    isSample: false,
  });
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibraryTarget, setImageLibraryTarget] = useState({ type: null, productId: null });
  const [imageLibrary, setImageLibrary] = useState({ loading: false, images: [], error: '' });
  const [ordersState, setOrdersState] = useState({ loading: false, error: '', items: [] });
  const [storageStats, setStorageStats] = useState({ files: 0, totalSize: 0, sizeInMB: 0 });
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageClearConfirm, setStorageClearConfirm] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalSaveMessage, setGeneralSaveMessage] = useState('');
  const [savingHero, setSavingHero] = useState(false);
  const [heroSaveMessage, setHeroSaveMessage] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutSaveMessage, setAboutSaveMessage] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);
  const [socialsSaveMessage, setSocialsSaveMessage] = useState('');
  const [showDetailedOrdersModal, setShowDetailedOrdersModal] = useState(false);
  const [detailedOrdersFilter, setDetailedOrdersFilter] = useState('all');

  // Validate any existing local auth flag against the backend/auth service
  React.useEffect(() => {
    let mounted = true;
    const validate = async () => {
      try {
        const stored = localStorage.getItem(AUTH_KEY) === 'true';
        if (!stored) return;
        const admin = await isAdmin();
        if (!mounted) return;
        if (admin) {
          setIsAuthed(true);
        } else {
          localStorage.removeItem(AUTH_KEY);
          setIsAuthed(false);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
        if (mounted) setIsAuthed(false);
      }
    };

    validate();

    return () => {
      mounted = false;
    };
  }, []);

  // Mobile menu state for admin navigation (declare early to avoid hooks-order issues)
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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
      setLoginError(error?.message || 'Login failed.');
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

  const handleDevLogin = async (e) => {
    e?.preventDefault?.();
    setLoginError('');
    const { data, error } = await devSignIn(username.includes('@') ? username : 'admin@whimsical.local', password);
    if (error) {
      setLoginError(error?.message || 'Dev login failed.');
      return;
    }

    // treat as logged in
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

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image: product.image || '',
      gallery: Array.isArray(product.gallery) ? product.gallery : ['', '', ''],
      category: product.category || 'Bouquet',
      isNew: product.isNew || false,
      isLimitedStock: product.isLimitedStock || false,
      isFeatured: product.isFeatured || false,
      isOnSale: product.isOnSale || false,
      stock: product.stock || '',
    });
    setShowAddPanel(true);
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
      is_sample: newProduct.isSample,
    };

    if (editingProductId) {
      // Persist update to Supabase
      const { data: updatedData, error: updateError } = await updateProductApi(editingProductId, supabaseProduct);
      if (updateError) {
        setFormError(updateError.error || 'Failed to update product in Supabase.');
        return;
      }

      // Sync local site content state (use camelCase keys expected by context)
      updateProduct(editingProductId, {
        name: supabaseProduct.name,
        description: supabaseProduct.description,
        price: supabaseProduct.price,
        image: supabaseProduct.image,
        gallery: supabaseProduct.gallery,
        category: supabaseProduct.category,
        isNew: supabaseProduct.is_new,
        isLimitedStock: supabaseProduct.is_limited_stock,
        isFeatured: supabaseProduct.is_featured,
        isOnSale: supabaseProduct.is_on_sale,
        stock: supabaseProduct.stock,
        isSample: supabaseProduct.is_sample,
      });

      setEditingProductId(null);
      setShowAddPanel(false);
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
        isSample: false,
      });
      return;
    }

    // Create new product
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
      isSample: false,
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
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80"
            alt="Soft floral background"
            className="w-full h-full object-cover opacity-10"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-muted-pink/90 via-beige/95 to-beige" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/80 backdrop-blur p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="text-center mb-4">
              <img src="/logo-whimsical.png" alt="Whimsical logo" className="w-28 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-soft-brown">Admin</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Store Management Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm font-medium text-soft-brown">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-beige/60 px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                  placeholder="Admin"
                  autoFocus
                />
              </label>

              <label className="block text-sm font-medium text-soft-brown">
                <span>Password</span>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-beige/60 px-4 py-3 sm:py-2.5 pr-12 text-base sm:text-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-soft-brown text-xs sm:text-sm hover:text-accent-red transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {loginError && <p className="text-xs sm:text-sm text-red-500 bg-red-50/50 p-2.5 rounded-lg">{loginError}</p>}

              <button type="submit" className="btn-primary w-full py-3 sm:py-2.5 text-base sm:text-sm font-semibold">
                Sign In
              </button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleDevLogin}
                  className="text-xs text-accent-red hover:underline"
                >
                  Use local dev login
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const hero = content?.hero || defaultContent.hero;
  const about = content?.about || defaultContent.about;
  const socials = content?.socials || defaultContent.socials;
  const general = content?.general || defaultContent.general;
  const products = content?.products || [];
  const totalProducts = products.length;
  const lowStockCount = products.filter((product) => Number(product.stock) <= 5).length;
  const newArrivalCount = products.filter((product) => product.isNew).length;
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige/30 to-white overflow-x-hidden">
      <div className="w-full max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-6 md:py-10">
        {/* Mobile Admin Header */}
        <div className="lg:hidden flex items-center justify-between mb-3 gap-2">
          <h1 className="text-sm sm:text-lg font-bold text-soft-brown truncate">Admin</h1>
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            className="p-1.5 text-soft-brown hover:text-accent-red hover:bg-muted-pink/20 rounded-lg transition flex-shrink-0"
            aria-label="Toggle admin menu"
            aria-expanded={showAdminMenu}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar - appears directly below button */}
        {showAdminMenu && (
          <aside className="lg:hidden mb-4 order-2 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-beige/40 p-3 sm:p-4 md:p-5">
              <div className="lg:block">
                <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Dashboard</p>
              </div>
              <nav className="space-y-1 sm:space-y-2 text-xs sm:text-sm font-medium text-soft-brown">
                {[
                  ['hero', 'Hero Banner'],
                  ['about', 'About Story'],
                  ['inventory', 'Inventory'],
                  ['orders', 'Orders'],
                  ['storage', 'Storage'],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={`#${href}`}
                    onClick={() => setShowAdminMenu(false)}
                    className="block rounded-lg px-2.5 sm:px-3 py-2 sm:py-2 hover:bg-muted-pink/20 hover:text-accent-red transition active:bg-muted-pink/40"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <button
                  onClick={resetContent}
                  className="w-full rounded-full border border-beige/80 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-soft-brown hover:bg-beige/40 active:bg-beige/60 font-medium transition"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => {
                    supaSignOut();
                    setIsAuthed(false);
                    localStorage.removeItem(AUTH_KEY);
                  }}
                  className="w-full rounded-full bg-soft-brown text-white px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold hover:bg-soft-brown/85 active:bg-soft-brown/70 transition"
                >
                  Log out
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className="grid gap-3 md:gap-6 lg:gap-8 lg:grid-cols-[160px_1fr]">
          {/* Sidebar - Desktop only */}
          <aside className="hidden lg:block lg:sticky lg:top-20 h-fit order-2 lg:order-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-beige/40 p-3 sm:p-4 md:p-5">
              <div className="lg:block">
                <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/60">Dashboard</p>
                <h1 className="hidden lg:block text-lg sm:text-2xl font-bold text-soft-brown mb-3 sm:mb-4">Content Editor</h1>
              </div>
              <nav className="space-y-1 sm:space-y-2 text-xs sm:text-sm font-medium text-soft-brown">
                {[
                  ['hero', 'Hero Banner'],
                  ['about', 'About Story'],
                  ['inventory', 'Inventory'],
                  ['orders', 'Orders'],
                  ['storage', 'Storage'],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={`#${href}`}
                    onClick={() => setShowAdminMenu(false)}
                    className="block rounded-lg px-2.5 sm:px-3 py-2 sm:py-2 hover:bg-muted-pink/20 hover:text-accent-red transition active:bg-muted-pink/40"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <button
                  onClick={resetContent}
                  className="w-full rounded-full border border-beige/80 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-soft-brown hover:bg-beige/40 active:bg-beige/60 font-medium transition"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => {
                    supaSignOut();
                    setIsAuthed(false);
                    localStorage.removeItem(AUTH_KEY);
                  }}
                  className="w-full rounded-full bg-soft-brown text-white px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold hover:bg-soft-brown/85 active:bg-soft-brown/70 transition"
                >
                  Log out
                </button>
              </div>
            </div>
          </aside>

          <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 order-1 lg:order-2 w-full min-w-0">
      <section id="hero" className="bg-gradient-to-br from-white to-beige/20 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40 transition-shadow duration-300 w-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">Hero Section</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">Hero Banner</h2>
            <p className="text-sm text-gray-600">Customize the homepage hero section that welcomes visitors</p>
          </div>
          <div>
            <button
              onClick={async () => {
                setHeroSaveMessage('');
                setSavingHero(true);
                try {
                  const res = await updateSiteSetting('hero', hero);
                  if (res.error) throw res.error;
                  setHeroSaveMessage('Saved successfully');
                } catch (err) {
                  console.error('Failed to save hero', err);
                  setHeroSaveMessage(err?.message || 'Failed to save hero');
                } finally {
                  setSavingHero(false);
                  setTimeout(() => setHeroSaveMessage(''), 3000);
                }
              }}
              disabled={savingHero}
              className="rounded-full bg-accent-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingHero ? 'Saving…' : 'Save'}
            </button>
            {heroSaveMessage && <div className="text-sm text-soft-brown mt-1">{heroSaveMessage}</div>}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5 bg-white/60 rounded-2xl p-4 sm:p-6 backdrop-blur">
          <div>
            <TextField label="Tagline" value={hero.tagline} onChange={(value) => updateContent('hero', { tagline: value })} />
            <p className="text-xs text-gray-500 mt-1 ml-1">Small text above the main heading</p>
          </div>
          <div>
            <TextField label="Heading" value={hero.heading} onChange={(value) => updateContent('hero', { heading: value })} />
            <p className="text-xs text-gray-500 mt-1 ml-1">Main hero section title</p>
          </div>
          <div>
            <TextField
              label="Description"
              value={hero.description}
              onChange={(value) => updateContent('hero', { description: value })}
              textarea
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Brief description below the heading</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-soft-brown">📊 Featured Statistics</h3>
            <p className="text-sm text-gray-600">Show key metrics on the hero section</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hero.stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="group bg-white rounded-2xl border-2 border-beige/40 hover:border-accent-red/60 p-4 sm:p-5 space-y-3 sm:space-y-4 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-soft-brown/60 group-hover:text-accent-red transition-colors">Stat {index + 1}</span>
                  <span className="text-2xl">📈</span>
                </div>
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
      <section className="bg-gradient-to-br from-white to-beige/20 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40 transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">⚙️ Configuration</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">Shop Settings</h2>
            <p className="text-sm text-gray-600">Configure checkout costs and fees</p>
          </div>
          <div>
            <button
              onClick={async () => {
                setGeneralSaveMessage('');
                setSavingGeneral(true);
                try {
                  // Persist both settings
                  const shipRes = await updateSiteSetting('shippingFee', general?.shippingFee ?? 0);
                  if (shipRes.error) throw shipRes.error;
                  const taxRes = await updateSiteSetting('taxRate', general?.taxRate ?? 0);
                  if (taxRes.error) throw taxRes.error;
                  setGeneralSaveMessage('Saved successfully');
                } catch (err) {
                  console.error('Failed to save general settings', err);
                  setGeneralSaveMessage(err?.message || 'Failed to save settings');
                } finally {
                  setSavingGeneral(false);
                  setTimeout(() => setGeneralSaveMessage(''), 3000);
                }
              }}
              disabled={savingGeneral}
              className="rounded-full bg-accent-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingGeneral ? 'Saving…' : 'Save'}
            </button>
            {generalSaveMessage && <div className="text-sm text-soft-brown mt-1">{generalSaveMessage}</div>}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          <div className="bg-white/60 rounded-2xl p-4 sm:p-5 backdrop-blur border border-beige/40 hover:border-accent-red/30 transition-colors">
            <TextField
              label="Flat Shipping Fee (PHP)"
              value={general?.shippingFee ?? 0}
              onChange={(value) => updateContent('general', { shippingFee: Number(value) || 0 })}
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">Applied to all orders</p>
          </div>
          <div className="bg-white/60 rounded-2xl p-4 sm:p-5 backdrop-blur border border-beige/40 hover:border-accent-red/30 transition-colors">
            <TextField
              label="Tax Rate (e.g., 0.08 for 8%)"
              value={general?.taxRate ?? 0}
              onChange={(value) => updateContent('general', { taxRate: Number(value) || 0 })}
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">Percentage applied to subtotal</p>
          </div>
          
        </div>
      </section>
      <section className="bg-gradient-to-bl from-white to-muted-pink/10 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40 transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">🔗 Community</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">Social Links</h2>
            <p className="text-sm text-gray-600">Connect with customers on social media</p>
          </div>
          <div>
            <button
              onClick={async () => {
                setSocialsSaveMessage('');
                setSavingSocials(true);
                try {
                  const res = await updateSiteSetting('socials', socials);
                  if (res.error) throw res.error;
                  setSocialsSaveMessage('Saved successfully');
                } catch (err) {
                  console.error('Failed to save socials', err);
                  setSocialsSaveMessage(err?.message || 'Failed to save socials');
                } finally {
                  setSavingSocials(false);
                  setTimeout(() => setSocialsSaveMessage(''), 3000);
                }
              }}
              disabled={savingSocials}
              className="rounded-full bg-accent-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSocials ? 'Saving…' : 'Save'}
            </button>
            {socialsSaveMessage && <div className="text-sm text-soft-brown mt-1">{socialsSaveMessage}</div>}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          {[
            ['facebook', 'Facebook', 'facebook.png'],
            ['instagram', 'Instagram', 'instagram.png'],
            ['tiktok', 'TikTok', 'tiktok.png'],
          ].map(([key, label, icon]) => (
            <div key={key} className="bg-white/60 rounded-2xl p-4 sm:p-5 backdrop-blur border border-beige/40 hover:border-accent-red/30 transition-colors space-y-3">
              <div className="flex items-center gap-2">
                <img src={`/logo/${icon}`} alt={label} className="h-7 w-7 object-contain" />
                <h3 className="font-semibold text-soft-brown">{label}</h3>
              </div>
              <TextField
                label="Profile URL"
                value={socials?.[key] || ''}
                onChange={(value) => updateContent('socials', { [key]: value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-gradient-to-br from-white to-beige/20 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40 transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">📖 Story</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">About Section</h2>
            <p className="text-sm text-gray-600">Tell customers your brand story</p>
          </div>
          <div>
            <button
              onClick={async () => {
                setAboutSaveMessage('');
                setSavingAbout(true);
                try {
                  const res = await updateSiteSetting('about', about);
                  if (res.error) throw res.error;
                  setAboutSaveMessage('Saved successfully');
                } catch (err) {
                  console.error('Failed to save about', err);
                  setAboutSaveMessage(err?.message || 'Failed to save about');
                } finally {
                  setSavingAbout(false);
                  setTimeout(() => setAboutSaveMessage(''), 3000);
                }
              }}
              disabled={savingAbout}
              className="rounded-full bg-accent-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingAbout ? 'Saving…' : 'Save'}
            </button>
            {aboutSaveMessage && <div className="text-sm text-soft-brown mt-1">{aboutSaveMessage}</div>}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5 bg-white/60 rounded-2xl p-4 sm:p-6 backdrop-blur border border-beige/40">
          <div>
            <TextField label="Heading" value={about.heading} onChange={(value) => updateContent('about', { heading: value })} />
            <p className="text-xs text-gray-500 mt-1 ml-1">Main section title</p>
          </div>
          <div>
            <TextField
              label="Description"
              value={about.description}
              onChange={(value) => updateContent('about', { description: value })}
              textarea
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Your brand story</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-soft-brown">✨ Highlights</h3>
            <p className="text-sm text-gray-600">Key points about your business</p>
          </div>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {about.highlights.map((item, index) => (
              <div key={`${item.title}-${index}`} className="group bg-white rounded-2xl border-2 border-beige/40 hover:border-muted-pink/60 p-4 sm:p-5 space-y-3 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/80">
                <div className="flex items-start justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-soft-brown/60">Highlight {index + 1}</span>
                  <span className="text-lg">⭐</span>
                </div>
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

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-soft-brown">🎯 Core Pillars</h3>
            <p className="text-sm text-gray-600">Your business values and principles</p>
          </div>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {about.pillars.map((item, index) => (
              <div key={`${item.title}-${index}`} className="group bg-white rounded-2xl border-2 border-beige/40 hover:border-accent-red/40 p-4 sm:p-5 space-y-3 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/80">
                <div className="flex items-start justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-soft-brown/60">Pillar {index + 1}</span>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateNestedItem('about', 'pillars', index, 'title', value)}
                />
                <TextField
                  label="Description"
                  value={item.detail}
                  onChange={(value) => updateNestedItem('about', 'pillars', index, 'detail', value)}
                  textarea
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="inventory" className="bg-gradient-to-br from-white to-beige/20 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40 transition-shadow duration-300">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">📦 Inventory</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">Product Catalog</h2>
          <p className="text-sm text-gray-600">Manage your product collection</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Total Products', value: totalProducts, icon: '📦', color: 'from-blue-50 to-blue-100/50' },
            { label: 'Low Stock (≤5)', value: lowStockCount, icon: '⚠️', color: 'from-red-50 to-red-100/50', highlight: lowStockCount > 0 },
            { label: 'New Arrivals', value: newArrivalCount, icon: '🆕', color: 'from-green-50 to-green-100/50' },
          ].map(({ label, value, icon, color, highlight }) => (
            <div
              key={label}
              className={`group rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 cursor-default hover:shadow-md ${
                highlight 
                  ? 'border-accent-red/40 bg-gradient-to-br from-accent-red/5 to-red-50/30 hover:border-accent-red/60' 
                  : `border-beige/40 bg-gradient-to-br ${color} hover:border-accent-red/40`
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest font-semibold text-soft-brown/60 group-hover:text-soft-brown transition-colors">{label}</p>
                <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-soft-brown">{value}</p>
              {highlight && <p className="text-xs text-accent-red font-medium mt-2">⚠️ Action needed</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch bg-gradient-to-r from-beige/10 to-muted-pink/5 rounded-2xl p-4 sm:p-5">
          <label className="flex-1 text-xs sm:text-sm font-medium text-soft-brown">
            <span className="block mb-2 font-semibold">🔍 Search Products</span>
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full rounded-lg sm:rounded-xl border-2 border-beige/50 hover:border-accent-red/30 focus:border-accent-red focus:ring-0 bg-white/90 px-4 py-2.5 sm:py-2 text-base sm:text-sm text-gray-700 shadow-sm transition-all duration-200 placeholder:text-gray-400"
            />
          </label>
          <button
            onClick={() => setShowAddPanel(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 px-6 sm:px-8 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200 self-end sm:self-auto whitespace-nowrap"
          >
            <span>✨</span> Add Product
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border-2 border-beige/40 bg-white shadow-lg">
          {filteredProducts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-2xl mb-2">📦</p>
              <p className="text-gray-500">No products found. Try a different search or add a new product.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-beige/30 to-beige/20 border-b-2 border-beige/40">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Image</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Price</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Stock</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">New</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-soft-brown uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beige/30">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted-pink/20 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-14 w-14 object-cover rounded-lg border border-beige/40 shadow-sm group-hover:shadow-md transition-all" loading="lazy" />
                          ) : (
                            <div className="h-14 w-14 bg-gradient-to-br from-beige/40 to-beige/20 rounded-lg border-2 border-dashed border-beige/40 flex items-center justify-center group-hover:border-accent-red/40 transition-colors">
                              <span className="text-xs text-soft-brown/60">No img</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 min-w-0">
                            <p className="font-semibold text-soft-brown truncate">{product.name || 'Untitled'}</p>
                            <p className="text-xs text-gray-500 truncate">{product.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={product.category}
                            onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                            className="text-sm rounded-lg border border-beige/60 bg-white/90 hover:bg-white hover:border-accent-red/40 px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30 transition-all"
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
                            className="text-sm w-28 rounded-lg border border-beige/60 bg-white/90 hover:bg-white hover:border-accent-red/40 px-3 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30 transition-all font-medium"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => updateProduct(product.id, { stock: e.target.value })}
                            className={`text-sm w-20 rounded-lg border-2 bg-white/90 hover:bg-white px-3 py-2 text-gray-700 shadow-sm focus:ring-1 focus:ring-accent-red/30 transition-all font-medium ${
                              Number(product.stock) <= 5 
                                ? 'border-accent-red/60 focus:border-accent-red' 
                                : 'border-beige/60 hover:border-accent-red/40 focus:border-accent-red'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.isNew}
                              onChange={(e) => updateProduct(product.id, { isNew: e.target.checked })}
                              className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer w-5 h-5"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 font-medium text-xs transition-all hover:shadow-md"
                            >
                              ✎ Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Delete this product?')) {
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
                                    console.warn('Failed to delete images', err);
                                  }

                                  if (product.id) {
                                    try {
                                      await deleteProductApi(product.id);
                                    } catch (err) {
                                      console.warn('Failed to delete product', err);
                                    }
                                  }

                                  removeProduct(product.id);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs transition-all hover:shadow-md"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Card Layout */}
              <div className="sm:hidden space-y-4 p-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="rounded-2xl border-2 border-beige/40 bg-white p-4 space-y-3 hover:border-accent-red/40 transition-colors shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-16 w-16 object-cover rounded-lg border border-beige/40 shadow-sm" loading="lazy" />
                        ) : (
                          <div className="h-16 w-16 bg-gradient-to-br from-beige/40 to-beige/20 rounded-lg border-2 border-dashed border-beige/40 flex items-center justify-center">
                            <span className="text-xs text-soft-brown/60">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-soft-brown truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-beige/30 text-soft-brown">{product.category}</span>
                          {product.isNew && <span className="text-xs font-bold px-2 py-1 rounded-full bg-accent-red/20 text-accent-red">🆕 New</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-beige/30">
                      <div>
                        <label className="text-xs font-semibold text-soft-brown/70 block mb-1">Price</label>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                          className="w-full text-sm rounded-lg border border-beige/60 bg-white/90 hover:bg-white hover:border-accent-red/40 px-2 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-soft-brown/70 block mb-1">Stock</label>
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateProduct(product.id, { stock: e.target.value })}
                          className={`w-full text-sm rounded-lg border-2 bg-white/90 hover:bg-white px-2 py-2 text-gray-700 shadow-sm focus:ring-1 focus:ring-accent-red/30 transition-all font-medium ${
                            Number(product.stock) <= 5 
                              ? 'border-accent-red/60 focus:border-accent-red' 
                              : 'border-beige/60 hover:border-accent-red/40 focus:border-accent-red'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-beige/30">
                      <div>
                        <label className="text-xs font-semibold text-soft-brown/70 block mb-1">Category</label>
                        <select
                          value={product.category}
                          onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                          className="w-full text-sm rounded-lg border border-beige/60 bg-white/90 hover:bg-white hover:border-accent-red/40 px-2 py-2 text-gray-700 shadow-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red/30 transition-all"
                        >
                          <option value="Bouquet">Bouquet</option>
                          <option value="Keychain">Keychain</option>
                          <option value="Accessory">Accessory</option>
                        </select>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isNew}
                          onChange={(e) => updateProduct(product.id, { isNew: e.target.checked })}
                          className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer w-4 h-4"
                        />
                        <span className="text-xs font-medium text-soft-brown">Mark as New</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-beige/30">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 font-semibold text-sm transition-all hover:shadow-md"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this product?')) {
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
                              console.warn('Failed to delete images', err);
                            }

                            if (product.id) {
                              try {
                                await deleteProductApi(product.id);
                              } catch (err) {
                                console.warn('Failed to delete product', err);
                              }
                            }

                            removeProduct(product.id);
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-all hover:shadow-md"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section id="orders" className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">Orders</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-soft-brown">Recent Orders</h2>
          <p className="text-sm text-gray-600">Guest and customer orders placed from the checkout page.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <span className="text-soft-brown font-medium">
              {ordersState.items.length} total orders
            </span>
            <span className="text-muted-pink font-medium">
              {ordersState.items.filter(order => order.status === 'pending').length} pending
            </span>
          </div>
          <a
            onClick={() => setShowDetailedOrdersModal(true)}
            className="inline-flex items-center rounded-full bg-accent-red px-4 sm:px-6 py-2.5 sm:py-2 text-xs sm:text-sm text-white font-semibold shadow-md hover:bg-red-700 active:bg-red-800 transition cursor-pointer"
          >
            View Detailed Orders →
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
          <div className="overflow-hidden rounded-2xl border-2 border-beige/40 bg-white shadow-lg">
            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-beige/40 bg-gradient-to-r from-beige/30 to-beige/20 text-left text-xs uppercase tracking-wider font-bold text-soft-brown">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 hidden md:table-cell">Email</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/30">
                  {ordersState.items.map((order) => (
                    <tr key={order.id} className="hover:bg-muted-pink/20 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-soft-brown/80">
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 font-mono max-w-[100px] truncate group-hover:text-soft-brown">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm font-semibold text-soft-brown">
                        {order.shipping_address?.name || '👤 Guest'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 hidden md:table-cell max-w-[150px] truncate">
                        {order.email || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs sm:text-sm font-bold text-accent-red">
                        ₱{Number(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-muted-pink/30 text-soft-brown'
                        }`}>
                          {order.status === 'completed' ? '✓ Completed' :
                           order.status === 'pending' ? '⏳ Pending' :
                           order.status === 'cancelled' ? '✕ Cancelled' :
                           order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Card Layout */}
            <div className="sm:hidden space-y-4 p-4">
              {ordersState.items.map((order) => (
                <div key={order.id} className="rounded-2xl border-2 border-beige/40 bg-white p-4 space-y-3 hover:border-accent-red/40 transition-colors shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-soft-brown/70 font-semibold uppercase tracking-wide mb-1">Order ID</p>
                      <p className="text-xs text-gray-700 font-mono">{order.id.substring(0, 12)}...</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold flex-shrink-0 transition-colors ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-muted-pink/30 text-soft-brown'
                    }`}>
                      {order.status === 'completed' ? '✓' :
                       order.status === 'pending' ? '⏳' :
                       order.status === 'cancelled' ? '✕' :
                       '•'} {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-beige/30">
                    <div>
                      <p className="text-soft-brown/70 font-semibold mb-1">Date</p>
                      <p className="text-gray-700">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-soft-brown/70 font-semibold mb-1">Total</p>
                      <p className="text-gray-700 font-bold text-accent-red">₱{Number(order.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-beige/30">
                    <div>
                      <p className="text-soft-brown/70 font-semibold text-xs mb-1">Customer</p>
                      <p className="text-gray-700 text-xs font-medium">{order.shipping_address?.name || '👤 Guest'}</p>
                    </div>
                    <div>
                      <p className="text-soft-brown/70 font-semibold text-xs mb-1">Email</p>
                      <p className="text-gray-700 text-xs break-all">{order.email || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="storage" className="bg-gradient-to-br from-white to-beige/10 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-6 border-2 border-beige/40">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.6em] text-accent-red font-semibold">Storage</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-soft-brown">Storage Management</h2>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-r from-beige/30 to-beige/20 border-2 border-beige/40 p-4 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-soft-brown/70 uppercase tracking-wide mb-1">📦 Supabase Free Tier</p>
              <p className="text-lg sm:text-xl font-bold text-soft-brown">1 GB Total</p>
            </div>
            {storageStats.usageWarning && (
              <div className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300">
                <p className="text-xs font-bold text-amber-800">⚠️ {storageStats.usageWarning}</p>
              </div>
            )}
          </div>
          <div className="relative h-2 bg-beige/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-red/60 to-accent-red transition-all duration-500"
              style={{ width: `${Math.min((storageStats.sizeInGB / 1) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            <strong>Current Usage:</strong> {storageStats.sizeInGB} GB / 1 GB ({Math.round((storageStats.sizeInGB / 1) * 100)}%)
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-muted-pink/20 to-muted-pink/5 border-2 border-muted-pink/40 p-4 sm:p-6 space-y-3 hover:border-muted-pink/60 transition-colors group">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-soft-brown/70 uppercase tracking-wider">📁 Files</p>
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-soft-brown group-hover:text-accent-red transition-colors">{storageStats.files}</p>
            <p className="text-xs text-gray-600">total files</p>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-accent-red/15 to-accent-red/5 border-2 border-accent-red/40 p-4 sm:p-6 space-y-3 hover:border-accent-red/60 transition-colors group">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-soft-brown/70 uppercase tracking-wider">💾 Used</p>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-accent-red">{storageStats.sizeInMB} <span className="text-lg">MB</span></p>
            <p className="text-sm font-semibold text-gray-600">{storageStats.sizeInGB} GB</p>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-beige/30 to-beige/10 border-2 border-beige/40 p-4 sm:p-6 space-y-3 hover:border-beige/60 transition-colors group">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-soft-brown/70 uppercase tracking-wider">📊 Limit</p>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-soft-brown">1 <span className="text-lg">GB</span></p>
            <p className="text-xs text-gray-600">Free tier</p>
          </div>
        </div>

        {storageError && (
          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-red-800 font-semibold">❌ {storageError}</p>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t-2 border-beige/30">
          <button
            onClick={loadStorageStats}
            disabled={storageLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-accent-red/10 hover:bg-accent-red/20 text-accent-red px-6 py-3 text-sm font-semibold transition-all hover:shadow-md active:bg-accent-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {storageLoading ? '⏳ Refreshing...' : '🔄 Refresh Stats'}
          </button>

          <div className="pt-6 border-t-2 border-beige/30 space-y-4">
            <div>
              <h3 className="font-bold text-soft-brown text-sm uppercase tracking-wide">🗑️ Clear All Storage</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Permanently delete all {storageStats.files} product image(s). This action cannot be undone and will free up {storageStats.sizeInMB} MB of storage.
              </p>
            </div>
            
            {!storageClearConfirm ? (
              <button
                onClick={() => setStorageClearConfirm(true)}
                disabled={storageLoading || storageStats.files === 0}
                className="w-full rounded-lg bg-red-50 hover:bg-red-100 text-red-700 px-6 py-3 text-sm font-bold border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Delete All {storageStats.files} File(s)
              </button>
            ) : (
              <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-800">
                    ⚠️ Confirm Deletion
                  </p>
                  <p className="text-xs sm:text-sm text-red-700 leading-relaxed">
                    You are about to permanently delete <strong>{storageStats.files}</strong> file(s) totaling <strong>{storageStats.sizeInMB} MB</strong>. This action is <strong>irreversible</strong> and cannot be recovered.
                  </p>
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <button
                    onClick={handleClearStorage}
                    disabled={storageLoading}
                    className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-3 text-sm font-bold transition-all hover:shadow-md active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {storageLoading ? '⏳ Deleting...' : '✓ Yes, Delete All Files'}
                  </button>
                  <button
                    onClick={() => setStorageClearConfirm(false)}
                    disabled={storageLoading}
                    className="flex-1 rounded-lg border-2 border-red-300 bg-white hover:bg-red-50 text-red-700 px-4 py-3 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✕ Cancel
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
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 py-4 sm:py-0">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddPanel(false)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red transition p-1 hover:bg-muted-pink/20 rounded-lg"
              aria-label="Close add product dialog"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl sm:text-2xl font-semibold text-soft-brown mb-4 sm:mb-6 pr-8">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
            <form className="grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={handleAddProduct}>
              <TextField label="Name" value={newProduct.name} onChange={(value) => handleNewProductChange('name', value)} />
              <TextField
                label="Price"
                value={newProduct.price}
                onChange={(value) => handleNewProductChange('price', value)}
              />
              <label className="text-sm font-medium text-soft-brown">
                <span>Main Image URL</span>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(value) => handleNewProductChange('image', value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg sm:rounded-xl border border-beige/70 bg-white/80 px-3.5 sm:px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                />
              </label>
              <label className="text-sm font-medium text-soft-brown">
                <span>Upload Main Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], (data) => handleNewProductChange('image', data), 'new-product-image')}
                  disabled={uploadingImages['new-product-image']}
                  className="mt-2 w-full rounded-lg sm:rounded-xl border border-dashed border-beige/70 bg-white/50 px-3.5 sm:px-3 py-3 sm:py-2 text-xs sm:text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-pink/5 transition"
                />
                {uploadingImages['new-product-image'] && (
                  <p className="text-xs text-accent-red mt-2 font-medium">Uploading...</p>
                )}
              </label>
              <button
                type="button"
                onClick={() => openImageLibrary({ type: 'new', productId: null })}
                className="md:col-span-2 inline-flex items-center text-xs sm:text-sm text-accent-red hover:text-accent-red/80 font-medium transition rounded-lg px-3 py-2 hover:bg-accent-red/5 active:bg-accent-red/10"
              >
                📁 Browse image library
              </button>

              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-soft-brown mb-3">Gallery Images (Optional)</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {new Array(3).fill(0).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-xs font-medium text-soft-brown">
                        <span>Image {index + 1}</span>
                      </label>
                      <input
                        type="text"
                        value={newProduct.gallery?.[index] || ''}
                        onChange={(e) => handleNewProductGalleryChange(index, e.target.value)}
                        placeholder="URL or upload below"
                        className="w-full rounded-lg border border-beige/70 bg-white/80 px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files?.[0], (data) => handleNewProductGalleryChange(index, data), `new-product-gallery-${index}`)}
                        disabled={uploadingImages[`new-product-gallery-${index}`]}
                        className="w-full rounded-lg border border-dashed border-beige/70 bg-white/50 px-3 py-2 text-xs text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-pink/5 transition"
                      />
                      {uploadingImages[`new-product-gallery-${index}`] && (
                        <p className="text-xs text-accent-red font-medium">Uploading...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <TextField label="Stock Quantity" value={newProduct.stock} onChange={(value) => handleNewProductChange('stock', value)} />
              <label className="text-sm font-medium text-soft-brown">
                <span>Category</span>
                <select
                  value={newProduct.category}
                  onChange={(e) => handleNewProductChange('category', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-beige/70 bg-white/80 px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 shadow-sm focus:border-accent-red focus:ring-2 focus:ring-accent-red/30"
                >
                  <option value="Bouquet">Bouquet</option>
                  <option value="Keychain">Keychain</option>
                  <option value="Accessory">Accessory</option>
                </select>
              </label>
              
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-soft-brown mb-3">Product Flags</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-soft-brown cursor-pointer hover:bg-muted-pink/10 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={newProduct.isNew}
                      onChange={(e) => handleNewProductChange('isNew', e.target.checked)}
                      className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer"
                    />
                    <span>🆕 New Arrival</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-soft-brown cursor-pointer hover:bg-muted-pink/10 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={newProduct.isLimitedStock}
                      onChange={(e) => handleNewProductChange('isLimitedStock', e.target.checked)}
                      className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer"
                    />
                    <span>📦 Limited Stock</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-soft-brown cursor-pointer hover:bg-muted-pink/10 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={newProduct.isFeatured}
                      onChange={(e) => handleNewProductChange('isFeatured', e.target.checked)}
                      className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer"
                    />
                    <span>⭐ Featured</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-soft-brown cursor-pointer hover:bg-muted-pink/10 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={newProduct.isOnSale}
                      onChange={(e) => handleNewProductChange('isOnSale', e.target.checked)}
                      className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer"
                    />
                    <span>🔥 On Sale</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-soft-brown cursor-pointer hover:bg-muted-pink/10 p-2 rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={newProduct.isSample}
                      onChange={(e) => handleNewProductChange('isSample', e.target.checked)}
                      className="rounded border-beige/60 text-accent-red focus:ring-accent-red/40 cursor-pointer"
                    />
                    <span>📌 Sample Product</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <TextField
                  label="Description"
                  value={newProduct.description}
                  onChange={(value) => handleNewProductChange('description', value)}
                  textarea
                />
              </div>
              
              {formError && <p className="text-xs sm:text-sm text-red-500 md:col-span-2 bg-red-50/50 p-3 rounded-lg font-medium">{formError}</p>}
              
              <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2 border-t border-beige/40">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddPanel(false);
                    setEditingProductId(null);
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
                  }}
                  className="rounded-full border border-beige/60 px-4 py-2.5 sm:py-2 text-sm font-semibold text-soft-brown hover:bg-beige/20 active:bg-beige/40 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-full bg-accent-red px-6 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition shadow-md"
                >
                  {editingProductId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageLibrary && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 py-4 sm:py-0">
          <div className="w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <button
              onClick={() => setShowImageLibrary(false)}
              className="absolute right-4 top-4 text-soft-brown hover:text-accent-red transition p-1 hover:bg-muted-pink/20 rounded-lg z-10"
              aria-label="Close image library"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl sm:text-2xl font-semibold text-soft-brown mb-4 sm:mb-6 pr-8">📁 Image Library</h3>
            {imageLibrary.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{imageLibrary.error}</p>
              </div>
            )}
            {imageLibrary.loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-soft-brown">Loading images...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {imageLibrary.images.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No images found in storage yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {imageLibrary.images.map((url) => (
                      <button
                        type="button"
                        key={url}
                        onClick={() => handleSelectLibraryImage(url)}
                        className="group rounded-2xl border-2 border-beige/60 overflow-hidden hover:border-accent-red focus:outline-none focus:ring-2 focus:ring-accent-red/40 transition active:scale-95"
                      >
                        <div className="relative bg-beige/20 overflow-hidden">
                          <img
                            src={url}
                            alt="Product gallery"
                            className="w-full h-24 sm:h-32 object-cover group-hover:scale-110 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center group-hover:opacity-100 opacity-0">
                            <span className="text-white text-xl">✓</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-beige/40 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImageLibrary(false)}
                className="rounded-full border border-beige/60 px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-semibold text-soft-brown hover:bg-beige/20 active:bg-beige/40 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Orders Modal */}
      {showDetailedOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 py-4 sm:py-0">
          <div className="w-full sm:w-full md:w-3xl lg:w-4xl max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-beige/40 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-soft-brown">All Orders</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage and view all customer orders</p>
              </div>
              <button
                onClick={() => setShowDetailedOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Filter */}
              <div>
                <label className="block text-sm font-medium text-soft-brown mb-2">Filter by Status</label>
                <select 
                  value={detailedOrdersFilter} 
                  onChange={(e) => setDetailedOrdersFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-red text-sm"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Orders Table */}
              {ordersState.loading ? (
                <div className="text-center py-8 text-gray-600">Loading orders...</div>
              ) : ordersState.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No orders found</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border-2 border-beige/40 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-beige/40">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ordersState.items
                          .filter(order => detailedOrdersFilter === 'all' || order.status === detailedOrdersFilter)
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs text-gray-900 whitespace-nowrap">
                                {new Date(order.created_at).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-gray-900">{order.id}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">{order.shipping_address?.name || 'Guest'}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">{order.email}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">₱{Number(order.total || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-xs">
                                <select
                                  value={order.status}
                                  onChange={(e) => {
                                    const newStatus = e.target.value;
                                    setOrdersState(prev => ({
                                      ...prev,
                                      items: prev.items.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
                                    }));
                                    updateOrderStatus(order.id, newStatus);
                                  }}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-accent-red/40 cursor-pointer ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this order?')) {
                                      setOrdersState(prev => ({
                                        ...prev,
                                        items: prev.items.filter(o => o.id !== order.id)
                                      }));
                                      deleteOrder(order.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 font-medium hover:underline transition"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t-2 border-beige/40 bg-white px-4 sm:px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowDetailedOrdersModal(false)}
                className="rounded-full border border-beige/60 px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-semibold text-soft-brown hover:bg-beige/20 active:bg-beige/40 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminPage;
