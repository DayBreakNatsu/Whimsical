-- Whimsical Store Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============================================
-- PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON product_reviews(created_at DESC);

-- ============================================
-- CARTS TABLE (for authenticated users)
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
  tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- SITE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- ============================================
-- NEWSLETTER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read, only admins can write
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated admins can insert products" ON products
  FOR INSERT WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

CREATE POLICY "Only authenticated admins can update products" ON products
  FOR UPDATE USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

CREATE POLICY "Only authenticated admins can delete products" ON products
  FOR DELETE USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );



-- Product Reviews: Everyone can read, authenticated users can insert
CREATE POLICY "Reviews are viewable by everyone" ON product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reviews" ON product_reviews
  FOR INSERT WITH CHECK (true);

-- Carts: Users can only see/modify their own cart
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart" ON carts
  FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update any order" ON orders
  FOR UPDATE USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  ) WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

CREATE POLICY "Admins can delete any order" ON orders
  FOR DELETE USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

-- Site Settings: Everyone can read, only admins can write
CREATE POLICY "Site settings are viewable by everyone" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify site settings" ON site_settings
  FOR ALL USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  ) WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

-- Newsletter: Public insert, admin read
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

-- ============================================
-- INITIAL DATA SEED
-- ============================================
INSERT INTO site_settings (key, value) VALUES
  ('hero', '{"tagline": "BY ACHLYS", "heading": "Whimsical Fuzzy Bouquets & Keychains", "description": "Handcrafted floral keepsakes and charming accessories designed to brighten your day.", "stats": [{"value": "250+", "label": "Happy Customers"}, {"value": "120+", "label": "Custom Pieces"}, {"value": "48h", "label": "Crafting Time"}]}'),
  ('about', '{"heading": "Crafted with whimsy & heart", "description": "From fuzzy petals to sparkling accents, every arrangement is handcrafted in small batches.", "highlights": [{"title": "Sustainable fibers", "detail": "Using premium hypoallergenic fuzz"}, {"title": "Gift-ready", "detail": "Packaged with tissue and handwritten notes"}], "pillars": [{"icon": "🌸", "title": "Handcrafted", "detail": "Each petal is shaped individually"}, {"icon": "💝", "title": "Made with Love", "detail": "Curated palettes & textures"}, {"icon": "🎀", "title": "Perfect Gifts", "detail": "Custom notes & speedy shipping"}, {"icon": "✨", "title": "Limited Drops", "detail": "Seasonal capsules & collabs"}]}'),
  ('socials', '{"facebook": "https://facebook.com/whimsicalbyachlys", "instagram": "https://instagram.com/whimsicalbyachlys", "tiktok": "https://tiktok.com/@whimsicalbyachlys"}'),
  ('general', '{"shippingFee": 350, "taxRate": 0.08}')
ON CONFLICT (key) DO NOTHING;

