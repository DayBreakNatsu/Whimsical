import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useSiteContent } from '../context/SiteContentContext';

const HomePage = () => {
  const { content } = useSiteContent();
  const { hero, about, socials } = content;
  const allProducts = content.products || [];
  const heroStats = hero?.stats || [];
  
  // Get featured products, fallback to new products, then all products
  let featuredProducts = allProducts.filter(product => product.isFeatured).slice(0, 4);
  if (featuredProducts.length === 0) {
    featuredProducts = allProducts.filter(product => product.isNew).slice(0, 4);
  }
  if (featuredProducts.length === 0) {
    featuredProducts = allProducts.slice(0, 4);
  }

  // Get new arrivals (up to 8 products)
  const newArrivals = allProducts.filter(product => product.isNew).slice(0, 8);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80"
            alt="Soft floral background"
            className="w-full h-full object-cover opacity-20"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-muted-pink/90 via-beige/95 to-beige"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="text-center md:text-left space-y-6">
            <p className="tracking-[0.5em] text-soft-brown text-sm uppercase">{hero?.tagline || 'Welcome'}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-accent-red" style={{ fontFamily: 'Georgia, serif' }}>
              {hero?.heading || 'Whimsical Creations'}
            </h1>
            <p className="text-lg text-soft-brown/80 max-w-2xl">
              {hero?.description || 'Handcrafted with love and whimsy.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/products" className="btn-primary text-base px-8 py-3 text-center">
                Shop Bouquets
              </Link>
              <Link to="/products" className="btn-secondary text-base px-8 py-3 border border-muted-pink/50 text-center">
                View Catalog
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 text-soft-brown">
              {heroStats && heroStats.length > 0 ? (
                heroStats.map(({ value, label }) => (
                  <div key={label} className="text-center md:text-left">
                    <p className="text-3xl font-bold text-accent-red">{value}</p>
                    <p className="text-xs uppercase tracking-[0.3em]">{label}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-3 text-sm text-gray-500 text-center">Add hero stats from the admin dashboard.</p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur p-6 rounded-3xl shadow-2xl w-full max-w-sm">
            <img
              src="/logo-whimsical.png"
              alt="Whimsical by Achlys logo"
              className="w-48 mx-auto mb-6"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <p className="text-soft-brown text-center text-sm leading-relaxed">
              Fuzzy petals, sparkling charms, and whimsical palettes inspired by dreamy pastels. Each collection
              celebrates playfulness while keeping an elegant finish perfect for gifting.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-beige/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="uppercase tracking-[0.5em] text-xs text-soft-brown/70">⭐ Best Sellers</p>
                <h2 className="text-3xl font-bold text-soft-brown">Featured Products</h2>
                <p className="text-gray-600 mt-2">Curated bouquets and accessories our customers adore.</p>
              </div>
              <Link to="/products" className="btn-secondary self-start md:self-auto text-center">
                View Full Catalog
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="uppercase tracking-[0.5em] text-xs text-soft-brown/70">🆕 Just Dropped</p>
                <h2 className="text-3xl font-bold text-soft-brown">New Arrivals</h2>
                <p className="text-gray-600 mt-2">Fresh designs and limited edition pieces just added to our collection.</p>
              </div>
              <Link to="/products" className="btn-primary self-start md:self-auto text-center">
                Shop New Arrivals
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="bg-beige/20 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="uppercase tracking-[0.5em] text-xs text-soft-brown/70">Our Story</p>
              <h2 className="text-4xl font-bold text-soft-brown mb-6">{about?.heading || 'About Us'}</h2>
              <p className="text-gray-700 leading-relaxed">
                {about?.description || 'Crafted with love and attention to detail.'}
              </p>
              {about?.highlights && about.highlights.length > 0 && (
                <div className="mt-8 grid grid-cols-2 gap-6 text-soft-brown">
                  {about.highlights.map(({ title, detail }) => (
                    <div key={title} className="bg-beige/40 rounded-2xl p-4 hover:bg-beige/60 transition">
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-gray-600 mt-2">{detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {about?.pillars && about.pillars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {about.pillars.map(({ icon, title, detail }) => (
                  <div key={title} className="bg-white shadow-lg rounded-3xl p-6 border border-beige/40 hover:shadow-xl hover:-translate-y-1 transition">
                    <div className="w-12 h-12 bg-muted-pink/40 rounded-2xl flex items-center justify-center text-2xl mb-4">
                      {icon}
                    </div>
                    <h3 className="font-semibold text-soft-brown mb-2">{title}</h3>
                    <p className="text-sm text-gray-600">{detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-accent-red/10 via-muted-pink/10 to-warm-pink/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-soft-brown">Ready to Add Some Whimsy?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Explore our complete collection of handcrafted bouquets, keychains, and custom creations.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products" className="btn-primary px-8 py-3">
              Browse All Products
            </Link>
            <Link to="/cart" className="btn-secondary px-8 py-3 border border-muted-pink/50">
              View Cart
            </Link>
          </div>
        </div>
      </section>

      {/* Social Links */}
      {socials && (socials.facebook || socials.instagram || socials.tiktok) && (
        <section className="py-16 bg-gradient-to-r from-beige via-white to-beige">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.5em] text-soft-brown/70">Connect</p>
            <h2 className="text-3xl font-bold text-soft-brown">Follow Whimsical By Achlys</h2>
            <p className="text-gray-600">See behind-the-scenes crafting, product drops, and custom requests.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-muted-pink px-6 py-3 text-soft-brown hover:bg-muted-pink/20 transition"
                >
                  <span className="text-2xl">f</span>
                  Facebook
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-muted-pink px-6 py-3 text-soft-brown hover:bg-muted-pink/20 transition"
                >
                  <span className="text-2xl">📷</span>
                  Instagram
                </a>
              )}
              {socials.tiktok && (
                <a
                  href={socials.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-muted-pink px-6 py-3 text-soft-brown hover:bg-muted-pink/20 transition"
                >
                  <span className="text-2xl">♪</span>
                  TikTok
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
