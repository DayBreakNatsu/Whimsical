-- Add new product flag columns
-- Migration: Add is_limited_stock, is_featured, is_on_sale columns to products table

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_limited_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;

-- Create indexes for the new flag columns for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_is_limited_stock ON products(is_limited_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale);
