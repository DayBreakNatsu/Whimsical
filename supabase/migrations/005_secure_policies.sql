-- Secure production policies for Whimsical Store
-- This migration removes development-open access patterns and replaces admin checks
-- with JWT-claim based policies. Apply after the initial schema has been created.

-- Notes:
-- - Admin role is expected in JWT at app_metadata.role = 'admin'
-- - No GRANTs on auth.users are required
-- - Idempotent via DROP/CREATE of policies

-- =============================
-- PRODUCTS POLICIES
-- =============================

-- Enable RLS (safe if already enabled)
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Remove dev-open policy if it exists
DROP POLICY IF EXISTS "Dev allow all on products" ON public.products;

-- Base read policy (public read)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

-- Admin-only write policies (JWT claim based)
DROP POLICY IF EXISTS "Only authenticated admins can insert products" ON public.products;
CREATE POLICY "Only authenticated admins can insert products" ON public.products
  FOR INSERT
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

DROP POLICY IF EXISTS "Only authenticated admins can update products" ON public.products;
CREATE POLICY "Only authenticated admins can update products" ON public.products
  FOR UPDATE
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

DROP POLICY IF EXISTS "Only authenticated admins can delete products" ON public.products;
CREATE POLICY "Only authenticated admins can delete products" ON public.products
  FOR DELETE
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

-- =============================
-- ORDERS POLICIES
-- =============================

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Remove dev-open policy if it exists
DROP POLICY IF EXISTS "Dev allow all on orders" ON public.orders;

-- Select own orders or admin
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

-- Create orders (kept open; adjust to auth-only if desired)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Admin can update/delete any order
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" ON public.orders
  FOR UPDATE
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

DROP POLICY IF EXISTS "Admins can delete any order" ON public.orders;
CREATE POLICY "Admins can delete any order" ON public.orders
  FOR DELETE
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

-- =============================
-- SITE SETTINGS POLICIES
-- =============================

ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings" ON public.site_settings
  FOR ALL
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

-- =============================
-- NEWSLETTER SUBSCRIPTIONS POLICIES
-- =============================

ALTER TABLE IF EXISTS public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Only admins can view subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

-- =============================
-- PRODUCT REVIEWS POLICIES (unchanged default)
-- =============================

ALTER TABLE IF EXISTS public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.product_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.product_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.product_reviews;
CREATE POLICY "Anyone can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (true);

-- If you want authenticated-only reviews, replace the above with:
-- DROP POLICY IF EXISTS "Anyone can create reviews" ON public.product_reviews;
-- CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
