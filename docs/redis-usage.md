## Redis Caching Flow (Step by Step)

### 1. Initialize the Client
1. `src/lib/redis.ts` wraps the Upstash REST endpoint with `@upstash/redis` using `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Helper functions expose `getCachedData`, `setCachedData`, and `deleteCachedData`, defaulting to a 3600-second TTL.

### 2. Store Analytics Responses
1. `/api/query` hashes each question to `query:<sha256(question)>`.
2. On a successful SQL run, the handler calls:
   - `setCachedData(cacheKey, response, { ttl: 3600 })`
   - The payload includes SQL text, explanation, result rows, columns, visualization type, and timing.

### 3. Serve Cached Analytics
1. Before hitting Gemini or Supabase, the same endpoint checks `getCachedData<QueryResponse>(cacheKey)`.
2. If present, the API returns the cached body immediately with `"cached": true`, giving the UI instant results.

### 4. Cache Conversational Answers
1. `/api/chat` composes keys as `chat:<base64(question[:context])>`.
2. The handler first looks for a matching analytics cache entry (to reuse structured data) and then a chat cache entry via `getCachedData`.
3. Fresh Gemini responses are stored with `setCachedData(cacheKey, response, { ttl: 3600 })`.

### 5. Clear Cache When Needed
- The UI can send either of the following:
```json
// Delete a single entry
POST /api/clear-cache
{
  "question": "Show revenue by seller",
  "mode": "query"
}

// Purge all cached keys
DELETE /api/clear-cache
```
- The clear-cache route deletes specific keys via `deleteCachedData` or scans for `query:*` and `chat:*` patterns when wiping everything.

### 6. Data Retrieval Details
1. `getCachedData` gracefully handles raw strings and JSON payloads, parsing when possible.
2. Every API route marks cache hits by setting `cached: true` in the response so the frontend can surface “Cached” badges beside messages and analytics panes.

