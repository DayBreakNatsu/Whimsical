-- Allow users with specific admin email to be treated as admin in RLS
-- This is a fallback for when JWT metadata is missing. Safer than dev-open, but
-- still recommended to ensure app_metadata.role is set. Adjust the email as needed.

-- PRODUCTS
DROP POLICY IF EXISTS "Only authenticated admins can insert products" ON public.products;
CREATE POLICY "Only authenticated admins can insert products" ON public.products
  FOR INSERT
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

DROP POLICY IF EXISTS "Only authenticated admins can update products" ON public.products;
CREATE POLICY "Only authenticated admins can update products" ON public.products
  FOR UPDATE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

DROP POLICY IF EXISTS "Only authenticated admins can delete products" ON public.products;
CREATE POLICY "Only authenticated admins can delete products" ON public.products
  FOR DELETE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

-- ORDERS (admin paths)
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" ON public.orders
  FOR UPDATE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

DROP POLICY IF EXISTS "Admins can delete any order" ON public.orders;
CREATE POLICY "Admins can delete any order" ON public.orders
  FOR DELETE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

-- SITE SETTINGS
DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings" ON public.site_settings
  FOR ALL
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );

-- NEWSLETTER SUBSCRIPTIONS admin read
DROP POLICY IF EXISTS "Only admins can view subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Only admins can view subscriptions" ON public.newsletter_subscriptions
  FOR SELECT
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR lower(auth.jwt() ->> 'email') = 'admin@whimsical.local'
  );
