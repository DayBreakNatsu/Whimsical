import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import { getSiteSettings } from '../services/siteSettingsService';
/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = 'whimsical-site-content-v1';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export const defaultContent = {
  hero: {
    tagline: 'BY ACHLYS',
    heading: 'Whimsical Fuzzy Bouquets & Keychains',
    description:
      'Handcrafted floral keepsakes and charming accessories designed to brighten your day. Each piece is lovingly assembled to capture a magical, cozy aesthetic.',
    stats: [
      { value: '250+', label: 'Happy Customers' },
      { value: '120+', label: 'Custom Pieces' },
      { value: '48h', label: 'Crafting Time' },
    ],
  },
  about: {
    heading: 'Crafted with whimsy & heart',
    description:
      'From fuzzy petals to sparkling accents, every arrangement is handcrafted in small batches. We blend nostalgic color palettes with modern silhouettes so each bouquet or keychain feels like a keepsake.',
    highlights: [
      { title: 'Sustainable fibers', detail: 'Using premium hypoallergenic fuzz' },
      { title: 'Gift-ready', detail: 'Packaged with tissue and handwritten notes' },
    ],
    pillars: [
      { icon: '🌸', title: 'Handcrafted', detail: 'Each petal is shaped individually' },
      { icon: '💝', title: 'Made with Love', detail: 'Curated palettes & textures' },
      { icon: '🎀', title: 'Perfect Gifts', detail: 'Custom notes & speedy shipping' },
      { icon: '✨', title: 'Limited Drops', detail: 'Seasonal capsules & collabs' },
    ],
  },
  socials: {
    facebook: 'https://facebook.com/whimsicalbyachlys',
    instagram: 'https://instagram.com/whimsicalbyachlys',
    tiktok: 'https://tiktok.com/@whimsicalbyachlys',
  },
  general: {
    shippingFee: 350,
    taxRate: 0.08,
  },
  products: [],
};

const hydrateContent = (saved) => {
  if (!saved) return clone(defaultContent);
  return {
    hero: {
      ...clone(defaultContent.hero),
      ...(saved.hero || {}),
      stats: saved?.hero?.stats || clone(defaultContent.hero.stats),
    },
    about: {
      ...clone(defaultContent.about),
      ...(saved.about || {}),
      highlights: saved?.about?.highlights || clone(defaultContent.about.highlights),
      pillars: saved?.about?.pillars || clone(defaultContent.about.pillars),
    },
    socials: {
      ...clone(defaultContent.socials),
      ...(saved.socials || {}),
    },
    general: {
      ...clone(defaultContent.general),
      ...(saved.general || {}),
    },
    products: Array.isArray(saved?.products)
      ? saved.products.map((product, index) => {
          const defaultProduct = defaultContent.products[index % defaultContent.products.length];
          // Ensure image URL is valid and absolute
          let productImage = product.image || defaultProduct?.image || '';
          if (productImage && !productImage.startsWith('http://') && !productImage.startsWith('https://') && !productImage.startsWith('/')) {
            productImage = defaultProduct?.image || '';
          }
          
          // Ensure gallery URLs are valid
          const validGallery = Array.isArray(product.gallery) 
            ? product.gallery
                .slice(0, 3)
                .filter(Boolean)
                .map(url => {
                  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                    return null;
                  }
                  return url;
                })
                .filter(Boolean)
            : [];
          
          return {
            ...product,
            gallery: validGallery,
            image: productImage,
            reviews: Array.isArray(product.reviews)
              ? product.reviews.map((review, reviewIndex) => ({
                  id: review.id ?? Date.now() + reviewIndex,
                  name: review.name || 'Guest',
                  rating: Number(review.rating) || 5,
                  comment: review.comment || '',
                }))
              : [],
          };
        })
      : clone(defaultContent.products),
  };
};

export const SiteContentContext = createContext();

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(() => {
    if (typeof window === 'undefined') return clone(defaultContent);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return hydrateContent(stored ? JSON.parse(stored) : null);
    } catch (err) {
      console.warn('Failed to parse stored content', err);
      return clone(defaultContent);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    } catch (err) {
      console.warn('Failed to persist content', err);
    }
  }, [content]);

  // Load products and site settings from Supabase on mount
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        // Load products
        const { data: products, error: productsError } = await getProducts();
        if (productsError) {
          console.warn('Failed to load products from Supabase:', productsError);
        } else if (products && products.length > 0) {
          setContent((prev) => ({
            ...prev,
            products: products,
          }));
        }

        // Load site settings
        const { data: settings, error: settingsError } = await getSiteSettings();
        if (settingsError) {
          console.warn('Failed to load site settings from Supabase:', settingsError);
          return;
        }

        if (settings && Object.keys(settings).length > 0) {
          setContent((prev) => {
            const updated = { ...prev };
            
            // Merge hero settings
            if (settings.hero) {
              updated.hero = {
                ...prev.hero,
                ...(typeof settings.hero === 'object' ? settings.hero : {}),
              };
            }
            
            // Merge about settings
            if (settings.about) {
              updated.about = {
                ...prev.about,
                ...(typeof settings.about === 'object' ? settings.about : {}),
                highlights: (typeof settings.about === 'object' && Array.isArray(settings.about.highlights)) 
                  ? settings.about.highlights 
                  : prev.about.highlights,
                pillars: (typeof settings.about === 'object' && Array.isArray(settings.about.pillars)) 
                  ? settings.about.pillars 
                  : prev.about.pillars,
              };
            }
            
            // Merge socials settings
            if (settings.socials) {
              updated.socials = {
                ...prev.socials,
                ...(typeof settings.socials === 'object' ? settings.socials : {}),
              };
            }
            
            // Merge general settings (shipping fee, tax rate)
            if (settings.shippingFee !== undefined || settings.taxRate !== undefined) {
              updated.general = {
                ...prev.general,
                ...(settings.shippingFee !== undefined && { shippingFee: settings.shippingFee }),
                ...(settings.taxRate !== undefined && { taxRate: settings.taxRate }),
              };
            }
            
            return updated;
          });
        }
      } catch (err) {
        console.warn('Error loading data from Supabase:', err);
      }
    };

    loadDataFromSupabase();
  }, []);

  const updateContent = (section, updates) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
  };

  const updateNestedItem = (section, arrayKey, index, field, value) => {
    setContent((prev) => {
      const updatedArray = prev[section][arrayKey].map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [arrayKey]: updatedArray,
        },
      };
    });
  };

  const addProduct = (product) => {
    setContent((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          ...product,
          id: Date.now(),
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
          gallery: Array.isArray(product.gallery) ? product.gallery.slice(0, 3) : [],
          reviews: Array.isArray(product.reviews)
            ? product.reviews.map((review, index) => ({
                id: review.id ?? Date.now() + index,
                name: review.name || 'Guest',
                rating: Number(review.rating) || 5,
                comment: review.comment || '',
              }))
            : [],
        },
      ],
    }));
  };

  const updateProduct = (id, updates) => {
    setContent((prev) => ({
      ...prev,
      products: prev.products.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              price: updates.price !== undefined ? Number(updates.price) || 0 : item.price,
              stock: updates.stock !== undefined ? Number(updates.stock) || 0 : item.stock,
              gallery: updates.gallery
                ? Array.isArray(updates.gallery)
                  ? updates.gallery.slice(0, 3)
                  : item.gallery
                : item.gallery,
              reviews: updates.reviews
                ? Array.isArray(updates.reviews)
                  ? updates.reviews.map((review) => ({
                      ...review,
                      id: review.id ?? Date.now(),
                      rating: Number(review.rating) || 5,
                    }))
                  : item.reviews
                : item.reviews,
            }
          : item
      ),
    }));
  };

  const removeProduct = (id) => {
    setContent((prev) => ({
      ...prev,
      products: prev.products.filter((item) => item.id !== id),
    }));
  };

  const addProductReview = (productId, review) => {
    setContent((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId
          ? {
              ...product,
              reviews: [
                ...product.reviews,
                {
                  id: Date.now(),
                  name: review.name || 'Guest',
                  rating: Number(review.rating) || 5,
                  comment: review.comment || '',
                },
              ],
            }
          : product
      ),
    }));
  };

  const removeProductReview = (productId, reviewId) => {
    setContent((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId
          ? {
              ...product,
              reviews: product.reviews.filter((review) => review.id !== reviewId),
            }
          : product
      ),
    }));
  };

  const resetContent = () => setContent(clone(defaultContent));

  return (
    <SiteContentContext.Provider
      value={{ content, updateContent, updateNestedItem, addProduct, updateProduct, removeProduct, addProductReview, removeProductReview, resetContent }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}
