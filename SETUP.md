# Setup Guide - Brazilian E-Commerce Analytics GenAI Tool

> **Case Study Project for Maersk AP Mollar**  
> Built by **Rahul R** from **PES University**

This comprehensive guide will help you set up the GenAI-powered analytics tool for the Brazilian E-Commerce Olist dataset.

**🌐 Live Application:** [https://apmollar-casestudy.vercel.app/](https://apmollar-casestudy.vercel.app/)  
**📊 Dataset:** [Kaggle - Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and npm installed
- **Google AI Studio** account (for Gemini API)
- **Supabase** account (free tier works)
- **Upstash Redis** account (free tier works)
- **Git** (for cloning the repository)

## Step 1: Clone and Install

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Maersk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Step 2: Environment Variables

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
GEMINI_MODEL_NAME=gemini-pro

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
```

## Step 3: Google AI Studio Setup

1. **Visit Google AI Studio:**
   - Go to [https://aistudio.google.com/](https://aistudio.google.com/)
   - Sign in with your Google account

2. **Create API Key:**
   - Click on "Get API Key" or navigate to API Keys section
   - Create a new API key
   - Copy the API key

3. **Add to `.env.local`:**
   ```env
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

**Note:** The default model is `gemini-pro`. You can change it by setting `GEMINI_MODEL_NAME` in your `.env.local` file.

## Step 4: Supabase Setup

### 4.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `brazilian-ecommerce` (or your choice)
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created (2-3 minutes)

### 4.2 Create Database Schema

1. **Navigate to SQL Editor:**
   - In your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Create Tables:**
   - Run the SQL from `db/schema.sql` (if available)
   - Or create tables manually based on the Olist dataset schema

3. **Fix Existing Schema (If Needed):**
   - If you've already created tables and get foreign key errors
   - Run SQL from `db/fix-schema.sql` to remove problematic constraints
   - **Skip this if creating schema for the first time**

### 4.3 Create RPC Function

The application uses a custom RPC function to safely execute SQL queries:

1. **In SQL Editor, run the SQL from `db/rpc-function.sql`:**
   ```sql
   -- This creates the execute_sql function
   -- It only allows SELECT queries for security
   ```

2. **Verify the function:**
   - Check that `execute_sql` function appears in your database
   - It should accept a `query_text` parameter and return query results

### 4.4 Import Dataset

1. **Download the Dataset:**
   - Visit [Kaggle - Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/)
   - Download all CSV files
   - Extract to `db/dataset/` directory

2. **Run Import Script:**
   ```bash
   npm run db:import
   ```
   
   This will:
   - Read CSV files from `db/dataset/`
   - Import data into Supabase tables
   - Handle data type conversions
   - Clean and validate data

   **Note:** Import may take 10-30 minutes for large datasets. Monitor progress in console.

3. **Refresh Materialized View (If Applicable):**
   ```sql
   REFRESH MATERIALIZED VIEW order_summary;
   ```

### 4.5 Get Supabase Credentials

1. **In Supabase Dashboard:**
   - Go to "Settings" → "API"
   - Copy the following:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

2. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 5: Upstash Redis Setup

Redis is used for caching to improve performance and reduce API costs.

### 5.1 Create Redis Database

1. **Go to Upstash:**
   - Visit [https://upstash.com](https://upstash.com)
   - Sign up or log in (free tier available)

2. **Create Database:**
   - Click "Create Database"
   - Choose "Global" or specific region
   - Select "Regional" type (free tier)
   - Click "Create"

### 5.2 Get REST API Credentials

1. **After creating database:**
   - Click on your database to open details
   - Navigate to "REST API" tab (or "Details" → "REST API" section)
   - You'll see:
     - **UPSTASH_REDIS_REST_URL**: `https://your-database-name.upstash.io`
     - **UPSTASH_REDIS_REST_TOKEN**: Long token string starting with `AX...`

2. **Copy both values**

3. **Add to `.env.local`:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database-name.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

**Alternative:** If you can't find REST API tab:
- Click "Connect" button → Select "REST API"
- Or go to "Settings" → "REST API"

## Step 6: Run Development Server

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

3. **Verify setup:**
   - Home page should load
   - Click "Chat with Datasets"
   - Try asking a question

## Step 7: Test Features

### Test Chat with Memory

1. **Start a conversation:**
   - Ask: "Show me total number of orders"
   - Then ask: "And by state"
   - The AI should remember the previous query

2. **Test follow-ups:**
   - Ask: "Which product categories perform best?"
   - Then: "Top 5"
   - Then: "Show as bar chart"

### Test Visualizations

1. **Ask data questions:**
   - "Show me revenue trends by month"
   - "What payment methods are most popular?"
   - "Top customer locations"

2. **View visualizations:**
   - Click "Analytics" button on results
   - Explore different chart types

### Test Caching

1. **Ask a question:**
   - "What's the total revenue?"
   - Note the response time

2. **Ask the same question again:**
   - Should see "Cached" badge
   - Response should be instant

## Troubleshooting

### SQL Execution Errors

**Error: "function execute_sql does not exist"**

1. Make sure you've run `db/rpc-function.sql` in Supabase SQL Editor
2. Verify the function appears in your database
3. Check that service role key has correct permissions

**Error: "permission denied"**

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Check that the key has not expired
3. Ensure RPC function has proper security settings

### Data Import Errors

**Error: "table does not exist"**

1. Create database schema first (Step 4.2)
2. Verify all tables are created
3. Check table names match CSV file names

**Error: "foreign key constraint"**

1. Run `db/fix-schema.sql` to remove problematic constraints
2. Or import tables in correct order
3. Disable foreign key checks temporarily

**Import is slow:**

- This is normal for large datasets (100K+ rows)
- Monitor progress in console
- Consider importing in batches

### Gemini API Errors

**Error: "models/gemini-1.5-flash is not found"**

- Solution: Use `gemini-pro` (default) or set `GEMINI_MODEL_NAME=gemini-pro`
- Available models: `gemini-pro`, `gemini-1.5-pro`, `gemini-1.5-flash-latest`

**Error: "API key invalid"**

1. Verify `GOOGLE_AI_API_KEY` is set correctly
2. Check API key is not expired
3. Ensure you're using Google AI Studio API key (not Vertex AI)

**Error: "quota exceeded"**

1. Check your Google AI Studio quota
2. Free tier has rate limits
3. Wait a few minutes and try again

### Redis Cache Errors

**Error: "Redis connection failed"**

1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Check Redis database is active in Upstash dashboard
3. Application will work without Redis, but without caching

**Cache not working:**

- Check Redis credentials are correct
- Verify Redis database is accessible
- Check browser console for errors

### General Issues

**Port 3000 already in use:**

```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

**Module not found errors:**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not loading:**

1. Ensure `.env.local` is in project root
2. Restart development server after changing `.env.local`
3. Check for typos in variable names

## Database Schema Overview

The database includes:

- `olist_customers` - Customer information
- `olist_sellers` - Seller information  
- `olist_products` - Product details
- `olist_orders` - Order information
- `olist_order_items` - Order items
- `olist_order_payments` - Payment information
- `olist_order_reviews` - Customer reviews
- `olist_geolocation` - Geographic data
- `product_category_translation` - Product category translations
- `order_summary` - Materialized view for analytics

## Security Notes

- **RPC Function Security:**
  - `execute_sql` only allows SELECT queries
  - SQL injection attempts are blocked
  - All queries are validated before execution

- **API Keys:**
  - Never commit `.env.local` to git
  - Keep service role keys secret
  - Rotate keys if exposed

- **Database:**
  - Use RLS (Row Level Security) for production
  - Limit service role key usage
  - Monitor query logs

## Performance Tips

1. **Use Materialized Views:**
   - `order_summary` view for common queries
   - Refresh periodically: `REFRESH MATERIALIZED VIEW order_summary;`

2. **Redis Caching:**
   - Reduces API calls significantly
   - 1-hour TTL balances freshness and performance
   - Clear cache when needed via UI button

3. **Query Optimization:**
   - Gemini generates optimized SQL
   - Complex queries may take longer
   - Use LIMIT for large result sets

4. **Model Selection:**
   - `gemini-pro`: Balanced speed and quality
   - `gemini-1.5-flash`: Faster, good for simple queries
   - `gemini-1.5-pro`: Best quality, slower

## Next Steps

After setup:

1. **Test all features:**
   - Chat with memory
   - Visualizations
   - Caching
   - Follow-up questions

2. **Explore the dataset:**
   - Try different query types
   - Test various visualizations
   - Experiment with conversation flow

3. **Customize:**
   - Adjust chart types
   - Modify prompts
   - Add new features

## Support

If you encounter issues:

1. **Check logs:**
   - Browser console (F12)
   - Terminal/Server logs
   - Supabase logs

2. **Verify setup:**
   - All environment variables set
   - Database schema created
   - RPC function exists
   - Redis accessible

3. **Test components:**
   - Test each service individually
   - Verify API keys work
   - Check database connectivity

## Resources

- **Live Application:** [https://apmollar-casestudy.vercel.app/](https://apmollar-casestudy.vercel.app/)
- **Dataset:** [Kaggle - Brazilian E-Commerce](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/)
- **Documentation:**
  - [Next.js Docs](https://nextjs.org/docs)
  - [Supabase Docs](https://supabase.com/docs)
  - [Google AI Studio](https://aistudio.google.com/)
  - [Upstash Redis](https://docs.upstash.com/)

---

**Case Study Project for Maersk AP Mollar**  
**Built by Rahul R - PES University**
