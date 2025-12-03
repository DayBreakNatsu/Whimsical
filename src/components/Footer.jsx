import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-muted-pink mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-accent-red mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Whimsical By Achlys
          </h3>
          <p className="text-soft-brown mb-4">FUZZY PETALS & KEYCHAINS</p>
          
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-soft-brown hover:text-accent-red transition-colors">
              About
            </a>
            <a href="#" className="text-soft-brown hover:text-accent-red transition-colors">
              Contact
            </a>
            <a href="#" className="text-soft-brown hover:text-accent-red transition-colors">
              Shipping
            </a>
            <a href="#" className="text-soft-brown hover:text-accent-red transition-colors">
              Returns
            </a>
          </div>
          
          <div className="text-sm text-soft-brown">
            © 2023 Whimsical By Achlys. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
