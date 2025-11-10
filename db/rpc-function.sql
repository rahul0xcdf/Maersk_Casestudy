-- Supabase RPC function to execute SQL queries safely
-- Run this in your Supabase SQL editor to enable query execution

-- Create function to execute SQL (with safety checks)
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  normalized_query TEXT;
  cleaned_query TEXT;
  query_no_comments TEXT;
BEGIN
  -- Clean the query - remove trailing semicolons and extra whitespace
  cleaned_query := TRIM(query_text);
  
  -- Remove trailing semicolon if present
  IF cleaned_query ~ ';$' THEN
    cleaned_query := RTRIM(cleaned_query, ';');
    cleaned_query := TRIM(cleaned_query);
  END IF;
  
  -- Normalize for validation
  normalized_query := LOWER(cleaned_query);

  -- Remove SQL comments before validation
  -- Strip block comments /* ... */
  query_no_comments := REGEXP_REPLACE(normalized_query, '/\*.*?\*/', '', 'gs');
  -- Strip single-line comments -- ...
  query_no_comments := REGEXP_REPLACE(query_no_comments, '--.*$', '', 'gm');
  -- Trim again after removing comments
  query_no_comments := TRIM(query_no_comments);
  
  -- Safety check: Only allow SELECT statements
  IF NOT (query_no_comments LIKE 'select%' OR query_no_comments LIKE 'with%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous patterns (check after removing semicolon)
  IF query_no_comments ~* '(drop|delete|update|insert|alter|create|truncate|grant|revoke|exec|execute)' THEN
    RAISE EXCEPTION 'Potentially dangerous SQL operations are not allowed';
  END IF;
  
  -- Execute query and return as JSON (cleaned_query has no semicolon)
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', cleaned_query) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (adjust as needed)
-- GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
-- Or for service role (if using service role key):
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;

-- Alternative: Create specific query functions for common patterns
-- This is safer than allowing arbitrary SQL execution

-- Example: Get order statistics
CREATE OR REPLACE FUNCTION get_order_stats(
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL,
  state_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  avg_delivery_days NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT o.order_id) as total_orders,
    COALESCE(SUM(oi.price + oi.freight_value), 0) as total_revenue,
    COALESCE(AVG(oi.price + oi.freight_value), 0) as avg_order_value,
    COALESCE(AVG(EXTRACT(EPOCH FROM (o.order_delivered_customer_date - o.order_purchase_timestamp)) / 86400), 0) as avg_delivery_days
  FROM olist_orders o
  LEFT JOIN olist_order_items oi ON o.order_id = oi.order_id
  LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
  WHERE
    (start_date IS NULL OR o.order_purchase_timestamp >= start_date)
    AND (end_date IS NULL OR o.order_purchase_timestamp <= end_date)
    AND (state_filter IS NULL OR c.customer_state = state_filter)
    AND o.order_status = 'delivered';
END;
$$;

-- Example: Get top product categories
CREATE OR REPLACE FUNCTION get_top_categories(limit_count INT DEFAULT 10)
RETURNS TABLE (
  category_name TEXT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_price NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pct.product_category_name_english, p.product_category_name, 'Unknown') as category_name,
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.price + oi.freight_value) as total_revenue,
    AVG(oi.price) as avg_price
  FROM olist_order_items oi
  LEFT JOIN olist_products p ON oi.product_id = p.product_id
  LEFT JOIN product_category_translation pct ON p.product_category_name = pct.product_category_name
  GROUP BY category_name
  ORDER BY total_revenue DESC
  LIMIT limit_count;
END;
$$;

-- Example: Get payment method distribution
CREATE OR REPLACE FUNCTION get_payment_distribution()
RETURNS TABLE (
  payment_type TEXT,
  total_orders BIGINT,
  total_amount NUMERIC,
  percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  total NUMERIC;
BEGIN
  -- Get total amount
  SELECT SUM(payment_value) INTO total FROM olist_order_payments;
  
  RETURN QUERY
  SELECT
    op.payment_type,
    COUNT(DISTINCT op.order_id) as total_orders,
    SUM(op.payment_value) as total_amount,
    ROUND((SUM(op.payment_value) / NULLIF(total, 0)) * 100, 2) as percentage
  FROM olist_order_payments op
  GROUP BY op.payment_type
  ORDER BY total_amount DESC;
END;
$$;

-- Example: Get sales by state
CREATE OR REPLACE FUNCTION get_sales_by_state()
RETURNS TABLE (
  state TEXT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.customer_state as state,
    COUNT(DISTINCT o.order_id) as total_orders,
    SUM(oi.price + oi.freight_value) as total_revenue,
    AVG(oi.price + oi.freight_value) as avg_order_value
  FROM olist_orders o
  LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
  LEFT JOIN olist_order_items oi ON o.order_id = oi.order_id
  WHERE o.order_status = 'delivered'
    AND c.customer_state IS NOT NULL
  GROUP BY c.customer_state
  ORDER BY total_revenue DESC;
END;
$$;

-- Example: Get monthly sales trend
CREATE OR REPLACE FUNCTION get_monthly_sales(
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  month DATE,
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', o.order_purchase_timestamp)::DATE as month,
    COUNT(DISTINCT o.order_id) as total_orders,
    SUM(oi.price + oi.freight_value) as total_revenue,
    AVG(oi.price + oi.freight_value) as avg_order_value
  FROM olist_orders o
  LEFT JOIN olist_order_items oi ON o.order_id = oi.order_id
  WHERE
    o.order_status = 'delivered'
    AND (start_date IS NULL OR o.order_purchase_timestamp >= start_date)
    AND (end_date IS NULL OR o.order_purchase_timestamp <= end_date)
  GROUP BY month
  ORDER BY month;
END;
$$;

