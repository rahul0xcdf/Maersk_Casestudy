## Code Analysis Overview

### Frontend Chat Flow (Step by Step)
1. `src/components/ChatUI.tsx` renders the chat surface, manages local UI state, and stores chat history in `localStorage`.
2. When the user submits a prompt, `handleSubmit` detects whether it is an analytics query using helpers from `src/lib/chat-handlers.ts`.
3. The component builds the request payload with the latest prompt plus up to ten prior exchanges and chooses the endpoint:
   - `/api/query` for analytics-style questions.
   - `/api/chat` for conversational questions.
4. While the network call runs, the UI shows a “Thinking…” placeholder; once the response arrives, it appends an assistant `ChatMessage` and optionally surfaces analytics via the `QueryResult` panel.

### API Boundaries
1. `/api/query` turns natural-language analytics questions into SQL using Gemini (`src/lib/sql-generator.ts`), executes the SQL through Supabase, and feeds formatted results back to the UI.
2. `/api/chat` answers general questions using Gemini (`src/lib/gemini.ts`), optionally enriching the prompt with recent history and sample rows from Supabase.
3. Both routes share caching utilities from `src/lib/redis.ts` so repeat questions get instant responses.

### Request and Response Structures
#### Analytics Mode (`POST /api/query`)
```json
{
  "question": "Show total revenue by state",
  "history": [
    { "role": "user", "content": "Show total revenue by state" }
  ]
}
```
- Success returns
```json
{
  "sql": "SELECT ...",
  "explanation": "Brief summary of the query",
  "data": [{ "customer_state": "SP", "total_revenue": 12345.67 }],
  "columns": ["customer_state", "total_revenue"],
  "visualizationType": "map",
  "cached": false,
  "executionTime": 235
}
```

#### Conversational Mode (`POST /api/chat`)
```json
{
  "question": "What is the Olist dataset?",
  "includeData": false,
  "history": [
    { "role": "user", "content": "What is the Olist dataset?" }
  ]
}
```
- Success returns
```json
{
  "response": { "text": "Assistant reply..." },
  "cached": false
}
```

### Key Helper Modules
1. `src/lib/chat-handlers.ts` contains logic for classifying prompts, formatting numeric answers, and turning raw API responses into UI-friendly `ChatMessage` objects.
2. `src/components/QueryResult.tsx` renders the SQL explanation, visualization, and raw data preview alongside the chat transcript.
3. `src/lib/sql-generator.ts` centralizes SQL generation, schema context, and safety checks so only read-only statements reach the database.

