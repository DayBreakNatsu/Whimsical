-- Automatically decrement product stock when a new order is created

create or replace function public.decrement_product_stock_from_order()
returns trigger as $$
declare
  item jsonb;
  product_id uuid;
  qty int;
  product_id_text text;
begin
  -- Expect NEW.items to be a JSON array of objects with product_id and quantity
  if new.items is null then
    return new;
  end if;

  for item in select * from jsonb_array_elements(new.items)
  loop
    product_id_text := item ->> 'product_id';
    qty := coalesce((item ->> 'quantity')::int, 0);

    -- Only attempt to update stock if product_id looks like a valid UUID.
    -- This avoids errors when using temporary numeric IDs from the frontend.
    if product_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      product_id := product_id_text::uuid;
    else
      product_id := null;
    end if;

    if product_id is not null and qty > 0 then
      update products
      set stock = greatest(stock - qty, 0)
      where id = product_id;
    end if;
  end loop;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_decrement_stock_on_order on public.orders;

create trigger trg_decrement_stock_on_order
before insert on public.orders
for each row
execute function public.decrement_product_stock_from_order();


