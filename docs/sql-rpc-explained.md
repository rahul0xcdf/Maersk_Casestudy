## SQL RPC Workflow (Step by Step)

### 1. Build the Analytics Request
- The UI posts to `/api/query` with:
```json
{
  "question": "List total orders per month in 2018",
  "history": [
    { "role": "user", "content": "List total orders per month in 2018" }
  ]
}
```
- The request body combines the latest prompt with recent chat context so Gemini can generate contextual SQL.

### 2. Turn Natural Language Into SQL
1. The handler calls `generateSQLFromQuestion(question, context)` in `src/lib/sql-generator.ts`.
2. Gemini receives the Olist schema, conversation context, and explicit safety instructions.
3. The helper trims trailing semicolons and validates that the model returned a single `SELECT`/`WITH` query before proceeding.

### 3. Execute Through Supabase RPC
1. `src/lib/query-executor.ts` calls `supabaseAdmin.rpc('execute_sql', { query_text: cleanedSQL })`.
2. The service-role Supabase client invokes the stored procedure defined in `db/rpc-function.sql`.
3. The PL/pgSQL function:
   - Trims comments and disallows non-`SELECT` verbs.
   - Rejects dangerous patterns (`DROP`, `INSERT`, `EXEC`, etc.).
   - Wraps the incoming statement with `json_agg(row_to_json(...))` so the result comes back as JSON.

### 4. Shape the Response
1. The executor infers column names from the first row and returns `{ data, columns }`.
2. The API bundles SQL text, explanation, visualization hint, execution time, and a cache flag before responding:
```json
{
  "sql": "SELECT DATE_TRUNC('month', ...",
  "explanation": "Summarizes monthly orders for 2018",
  "data": [ { "month": "2018-01-01", "total_orders": 123 } ],
  "columns": ["month", "total_orders"],
  "visualizationType": "line",
  "cached": false,
  "executionTime": 187
}
```

### 5. Optional: Cache for Reuse
- On success, the handler stores the response in Redis under the SHA-256 key `query:<hash(question)>` with a one-hour TTL so identical follow-up questions can bypass Gemini and Supabase.

