-- Disabled dev-open policy for production safety. Keep here as reference only.
-- To re-enable for local development, uncomment and run in a local environment.
-- drop policy if exists "Dev allow all on orders" on public.orders;
-- create policy "Dev allow all on orders"
-- on public.orders
-- for all
-- using (true)
-- with check (true);



