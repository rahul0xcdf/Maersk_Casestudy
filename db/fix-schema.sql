-- Fix schema issues for data import
-- Run this SQL in Supabase SQL Editor if you've already created the tables

-- Drop foreign key constraint on products table
ALTER TABLE olist_products 
DROP CONSTRAINT IF EXISTS olist_products_product_category_name_fkey;

-- Drop foreign key constraints on order_items table
ALTER TABLE olist_order_items 
DROP CONSTRAINT IF EXISTS olist_order_items_product_id_fkey;

ALTER TABLE olist_order_items 
DROP CONSTRAINT IF EXISTS olist_order_items_seller_id_fkey;

-- Note: We keep the order_id foreign key as it's required for data integrity

