-- Compatibility layer: allow admin via app_metadata.role OR user_metadata.role
-- Apply after 005_secure_policies.sql if your admin users currently store
-- role inside user_metadata instead of app_metadata.

-- Helper expression we will apply across policies:
--   coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
--   OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)

-- =============================
-- PRODUCTS
-- =============================
DROP POLICY IF EXISTS "Only authenticated admins can insert products" ON public.products;
CREATE POLICY "Only authenticated admins can insert products" ON public.products
  FOR INSERT
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

DROP POLICY IF EXISTS "Only authenticated admins can update products" ON public.products;
CREATE POLICY "Only authenticated admins can update products" ON public.products
  FOR UPDATE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

DROP POLICY IF EXISTS "Only authenticated admins can delete products" ON public.products;
CREATE POLICY "Only authenticated admins can delete products" ON public.products
  FOR DELETE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

-- =============================
-- ORDERS (admin paths)
-- =============================
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" ON public.orders
  FOR UPDATE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

DROP POLICY IF EXISTS "Admins can delete any order" ON public.orders;
CREATE POLICY "Admins can delete any order" ON public.orders
  FOR DELETE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

-- =============================
-- SITE SETTINGS
-- =============================
DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings" ON public.site_settings
  FOR ALL
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );

-- =============================
-- NEWSLETTER SUBSCRIPTIONS (admin read)
-- =============================
DROP POLICY IF EXISTS "Only admins can view subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Only admins can view subscriptions" ON public.newsletter_subscriptions
  FOR SELECT
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
  );
