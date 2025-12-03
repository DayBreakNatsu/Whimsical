import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import { CartProvider } from './context/CartContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { OrderProvider } from './context/OrderContext';

function App() {
  return (
    <OrderProvider>
      <SiteContentProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-beige">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </SiteContentProvider>
    </OrderProvider>
  );
}

export default App
