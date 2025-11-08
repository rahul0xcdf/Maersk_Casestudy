# Setup Guide for GenAI-Powered Analytics Tool

This guide will help you set up the full-stack GenAI-powered analytics tool for the Brazilian E-Commerce Olist dataset.

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Vertex AI API enabled
- Supabase account (free tier works)
- Upstash Redis account (free tier works)

## Step 1: Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google AI Studio Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
# Optional: Specify model name (default: gemini-pro)
# Available models: gemini-pro, gemini-1.5-pro, gemini-1.5-flash-latest
# GEMINI_MODEL_NAME=gemini-pro

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
```

## Step 2: Google AI Studio Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy your API key and add it to your `.env.local` file as `GOOGLE_AI_API_KEY`

## Step 3: Supabase Setup

### 3.1 Create Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `db/schema.sql` to create all tables

### 3.2 Fix Existing Schema (If Tables Already Exist)

If you've already created the tables and are getting foreign key constraint errors:

1. In the SQL Editor, run the SQL from `db/fix-schema.sql`
2. This removes problematic foreign key constraints that prevent data import
3. **Skip this step if you're creating the schema for the first time**

### 3.3 Create RPC Function

1. In the SQL Editor, run the SQL from `db/rpc-function.sql`
2. This creates the `execute_sql` function that safely executes SQL queries
3. Optionally, use the specific query functions for better performance

### 3.4 Import Data

1. Install dependencies: `npm install`
2. Run the import script:
   ```bash
   npm run db:import
   ```

   This will:
   - Read CSV files from `db/dataset/`
   - Import data into Supabase tables
   - Handle data type conversions and cleaning

   **Note**: The import process may take a while for large datasets. You can monitor progress in the console.

### 3.5 Refresh Materialized View

After importing data, refresh the materialized view:

```sql
REFRESH MATERIALIZED VIEW order_summary;
```

## Step 4: Upstash Redis Setup

1. **Create a free Redis database:**
   - Go to [upstash.com](https://upstash.com)
   - Sign up or log in with your account
   - Click "Create Database"
   - Choose "Global" or a specific region
   - Select "Regional" type (free tier)
   - Click "Create"

2. **Get your REST URL and Token:**
   - After creating the database, click on it to open the details page
   - Go to the "REST API" tab (or look for "REST API" in the sidebar)
   - You'll see two values:
     - **UPSTASH_REDIS_REST_URL**: Looks like `https://your-database-name.upstash.io`
     - **UPSTASH_REDIS_REST_TOKEN**: A long token string starting with `AX...` or similar
   - Click the copy icon next to each value to copy them

3. **Add to `.env.local`:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database-name.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

**Alternative method:**
- If you can't find the REST API tab, look for:
  - "Details" tab → Scroll down to "REST API" section
  - Or click "Connect" button → Select "REST API" option
  - The credentials are also available in the "Settings" tab under "REST API"

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Test the Application

### Test Analytics Mode

1. Click on "Analytics Mode" in the chat interface
2. Try asking questions like:
   - "Which product category sold the most in Q4 2018?"
   - "Show average delivery time by state"
   - "Which sellers have the highest review scores?"
   - "What's the total revenue by payment method?"

### Test Chat Mode

1. Click on "Chat Mode" in the chat interface
2. Ask general questions about the dataset

## Troubleshooting

### SQL Execution Errors

If you see errors about the `execute_sql` function:
1. Make sure you've run the SQL from `db/rpc-function.sql` in Supabase
2. Check that the function has the correct permissions
3. Verify your service role key has the necessary permissions

### Data Import Errors

If data import fails:
1. Check that all CSV files are in `db/dataset/`
2. Verify your Supabase connection settings
3. Check the console for specific error messages
4. Make sure the schema has been created first

### Gemini API Errors

If you see Gemini API errors:

**Error: "models/gemini-1.5-flash is not found"**
- This means you're using the wrong model name
- **Solution:** The code now defaults to `gemini-pro` which works with Google AI Studio
- You can also set `GEMINI_MODEL_NAME=gemini-pro` in your `.env.local`
- Available models: `gemini-pro`, `gemini-1.5-pro`, `gemini-1.5-flash-latest`

**Other Gemini API errors:**
1. Verify your Google AI Studio API key is set correctly
2. Check that the API key is valid and not expired
3. Verify your `GOOGLE_AI_API_KEY` environment variable is set
4. Make sure you're using the correct API key from Google AI Studio
5. Try using `gemini-pro` model (default) if other models don't work
6. Check the [GEMINI_MODELS.md](./GEMINI_MODELS.md) file for model information

### Redis Cache Errors

If Redis caching fails:
1. Check your Upstash Redis credentials
2. Verify the REST URL and token are correct
3. The application will still work without Redis, but responses won't be cached

## Database Schema Overview

The database includes the following tables:

- `olist_customers` - Customer information
- `olist_sellers` - Seller information
- `olist_products` - Product details
- `olist_orders` - Order information
- `olist_order_items` - Order items
- `olist_order_payments` - Payment information
- `olist_order_reviews` - Customer reviews
- `olist_geolocation` - Geographic data
- `product_category_translation` - Product category translations
- `order_summary` - Materialized view for common analytics queries

## Security Notes

- The `execute_sql` RPC function only allows SELECT queries
- SQL injection attempts are blocked
- All queries are validated before execution
- Cache keys are hashed for security

## Performance Tips

1. Use the materialized view `order_summary` for common queries
2. Redis caching reduces API calls and speeds up responses
3. The Gemini model uses `gemini-1.5-flash` for faster responses
4. Queries are limited to 100 rows by default

## Next Steps

- Customize the visualization types
- Add more specific query functions in Supabase
- Implement user authentication
- Add more chart types (maps, heatmaps, etc.)
- Set up monitoring and logging

## Support

If you encounter any issues, check:
1. The browser console for client-side errors
2. The server logs for backend errors
3. Supabase logs for database errors
4. Google Cloud logs for Vertex AI errors
