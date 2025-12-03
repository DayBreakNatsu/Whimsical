import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { getTotalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-4 group flex-shrink-0">
            <img
              src="/logo-whimsical.png"
              alt="Whimsical by Achlys logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              loading="lazy"
            />
            <div className="hidden sm:block">
              <p className="text-xs sm:text-sm tracking-[0.3em] text-soft-brown">BY ACHLYS</p>
              <p className="text-lg sm:text-2xl font-bold text-accent-red" style={{ fontFamily: 'Georgia, serif' }}>
                Whimsical
              </p>
              <p className="text-xs text-soft-brown uppercase">Fuzzy Petals & Keychains</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="text-soft-brown hover:text-accent-red transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-soft-brown hover:text-accent-red transition-colors">
              Products
            </Link>
            <Link to="/cart" className="relative text-soft-brown hover:text-accent-red transition-colors">
              Cart
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-muted-pink/40 px-2 py-0.5 text-xs text-soft-brown">
                {getTotalItems()}
              </span>
            </Link>
            <Link
              to="/products"
              className="hidden lg:inline-flex items-center rounded-full bg-accent-red px-4 py-2 text-white font-semibold shadow-md hover:-translate-y-0.5 transition"
            >
              Shop Collection
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center rounded-full border border-beige/70 px-4 py-2 text-soft-brown hover:bg-muted-pink/30 hover:text-accent-red transition"
            >
              Admin Login
            </Link>
          </nav>

          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 text-soft-brown hover:text-accent-red hover:bg-muted-pink/20 rounded-lg transition"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-muted-pink py-3 space-y-1 bg-white/95">
            <Link
              to="/"
              onClick={closeMenu}
              className="block px-4 py-3 text-soft-brown hover:text-accent-red hover:bg-muted-pink/20 rounded transition font-medium"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={closeMenu}
              className="block px-4 py-3 text-soft-brown hover:text-accent-red hover:bg-muted-pink/20 rounded transition font-medium"
            >
              Products
            </Link>
            <Link
              to="/cart"
              onClick={closeMenu}
              className="flex items-center justify-between px-4 py-3 text-soft-brown hover:text-accent-red hover:bg-muted-pink/20 rounded transition font-medium"
            >
              <span>Cart</span>
              <span className="inline-flex items-center justify-center rounded-full bg-accent-red text-white px-2.5 py-1 text-sm font-semibold">
                {getTotalItems()}
              </span>
            </Link>
            <Link
              to="/products"
              onClick={closeMenu}
              className="block px-4 py-3 text-white font-semibold bg-accent-red hover:bg-accent-red/90 rounded transition text-center"
            >
              Shop Collection
            </Link>
            <Link
              to="/admin"
              onClick={closeMenu}
              className="block px-4 py-3 text-soft-brown font-medium border-2 border-beige/70 hover:bg-muted-pink/30 hover:text-accent-red rounded transition text-center"
            >
              Admin Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
