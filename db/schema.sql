-- Brazilian E-Commerce Olist Dataset Schema for PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS olist_customers (
    customer_id VARCHAR(255) PRIMARY KEY,
    customer_unique_id VARCHAR(255) NOT NULL,
    customer_zip_code_prefix VARCHAR(10),
    customer_city VARCHAR(255),
    customer_state VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sellers table
CREATE TABLE IF NOT EXISTS olist_sellers (
    seller_id VARCHAR(255) PRIMARY KEY,
    seller_zip_code_prefix VARCHAR(10),
    seller_city VARCHAR(255),
    seller_state VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product category translations
CREATE TABLE IF NOT EXISTS product_category_translation (
    product_category_name VARCHAR(255) PRIMARY KEY,
    product_category_name_english VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS olist_products (
    product_id VARCHAR(255) PRIMARY KEY,
    product_category_name VARCHAR(255),
    product_name_lenght INTEGER,
    product_description_lenght INTEGER,
    product_photos_qty INTEGER,
    product_weight_g INTEGER,
    product_length_cm INTEGER,
    product_height_cm INTEGER,
    product_width_cm INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
    -- Removed foreign key constraint to allow products with categories not in translation table
    -- FOREIGN KEY (product_category_name) REFERENCES product_category_translation(product_category_name)
);

-- Orders table
CREATE TABLE IF NOT EXISTS olist_orders (
    order_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    order_status VARCHAR(50),
    order_purchase_timestamp TIMESTAMP,
    order_approved_at TIMESTAMP,
    order_delivered_carrier_date TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES olist_customers(customer_id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS olist_order_items (
    order_id VARCHAR(255) NOT NULL,
    order_item_id INTEGER NOT NULL,
    product_id VARCHAR(255),
    seller_id VARCHAR(255),
    shipping_limit_date TIMESTAMP,
    price DECIMAL(10, 2),
    freight_value DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (order_id, order_item_id),
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id) ON DELETE CASCADE
    -- Removed foreign key constraints on product_id and seller_id to allow data import
    -- even if some products/sellers don't exist yet
    -- FOREIGN KEY (product_id) REFERENCES olist_products(product_id),
    -- FOREIGN KEY (seller_id) REFERENCES olist_sellers(seller_id)
);

-- Order payments table
CREATE TABLE IF NOT EXISTS olist_order_payments (
    order_id VARCHAR(255) NOT NULL,
    payment_sequential INTEGER NOT NULL,
    payment_type VARCHAR(50),
    payment_installments INTEGER,
    payment_value DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (order_id, payment_sequential),
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id)
);

-- Order reviews table
CREATE TABLE IF NOT EXISTS olist_order_reviews (
    review_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    review_score INTEGER,
    review_comment_title TEXT,
    review_comment_message TEXT,
    review_creation_date TIMESTAMP,
    review_answer_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id)
);

-- Geolocation table (optional, for mapping)
CREATE TABLE IF NOT EXISTS olist_geolocation (
    geolocation_zip_code_prefix VARCHAR(10),
    geolocation_lat DECIMAL(10, 8),
    geolocation_lng DECIMAL(11, 8),
    geolocation_city VARCHAR(255),
    geolocation_state VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON olist_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON olist_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_purchase_timestamp ON olist_orders(order_purchase_timestamp);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON olist_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON olist_order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON olist_products(product_category_name);
CREATE INDEX IF NOT EXISTS idx_payments_type ON olist_order_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_reviews_score ON olist_order_reviews(review_score);
CREATE INDEX IF NOT EXISTS idx_customers_state ON olist_customers(customer_state);
CREATE INDEX IF NOT EXISTS idx_sellers_state ON olist_sellers(seller_state);
CREATE INDEX IF NOT EXISTS idx_geolocation_zip ON olist_geolocation(geolocation_zip_code_prefix);

-- Create a materialized view for common analytics queries (optional optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS order_summary AS
SELECT 
    o.order_id,
    o.order_status,
    o.order_purchase_timestamp,
    o.order_delivered_customer_date,
    o.order_estimated_delivery_date,
    c.customer_state,
    c.customer_city,
    SUM(oi.price) as total_price,
    SUM(oi.freight_value) as total_freight,
    SUM(oi.price + oi.freight_value) as total_value,
    SUM(op.payment_value) as total_payment,
    MAX(op.payment_type) as payment_type,
    AVG(rev.review_score) as avg_review_score,
    COUNT(DISTINCT oi.product_id) as product_count
FROM olist_orders o
LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
LEFT JOIN olist_order_items oi ON o.order_id = oi.order_id
LEFT JOIN olist_order_payments op ON o.order_id = op.order_id
LEFT JOIN olist_order_reviews rev ON o.order_id = rev.order_id
GROUP BY o.order_id, o.order_status, o.order_purchase_timestamp, 
         o.order_delivered_customer_date, o.order_estimated_delivery_date,
         c.customer_state, c.customer_city;

CREATE INDEX IF NOT EXISTS idx_order_summary_timestamp ON order_summary(order_purchase_timestamp);
CREATE INDEX IF NOT EXISTS idx_order_summary_state ON order_summary(customer_state);

