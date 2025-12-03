import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { getTotalItems } = useCart();

  return (
    <header className="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-4 group">
            <img
              src="/logo-whimsical.png"
              alt="Whimsical by Achlys logo"
              className="w-16 h-16 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              loading="lazy"
            />
            <div>
              <p className="text-sm tracking-[0.3em] text-soft-brown">BY ACHLYS</p>
              <p className="text-2xl font-bold text-accent-red" style={{ fontFamily: 'Georgia, serif' }}>
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
            <button className="text-soft-brown hover:text-accent-red" aria-label="Open navigation menu">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
