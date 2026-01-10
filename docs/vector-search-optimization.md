# Vector Search Optimization Guide

## Overview
This document provides guidance on optimizing pgvector performance for the four tables with embedding columns in our database.

## Tables with Vector Embeddings

All embedding columns use OpenAI's `text-embedding-3-small` model (1536 dimensions):

1. **agent_documents** - RAG knowledge base for AI agents
2. **brand_voices** - Writing style/tone with embeddings
3. **content_learnings** - Cross-user learning from content generation
4. **writing_frameworks** - RAG knowledge base with vector embeddings

## Vector Indexes

### HNSW vs IVFFlat

We use **HNSW (Hierarchical Navigable Small World)** indexes instead of IVFFlat because:

✅ **Better query performance** - Faster similarity searches
✅ **Better recall** - More accurate nearest neighbor results
✅ **No training required** - Works immediately without VACUUM or data distribution analysis
✅ **Consistent performance** - Not affected by data distribution

**Trade-offs:**
- Slower index build time (acceptable for our use case)
- Higher memory usage (manageable with proper configuration)

### Index Configuration

```sql
CREATE INDEX agent_documents_embedding_idx 
ON agent_documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Parameters:**
- `m = 16`: Number of connections per layer
  - Higher = better recall, more memory
  - Default: 16 (good balance)
  - Range: 2-100

- `ef_construction = 64`: Dynamic candidate list size during build
  - Higher = better index quality, slower build
  - Default: 64 (good balance)
  - Range: 4-1000

## Query Optimization

### Basic Similarity Search

```sql
-- Find 10 most similar documents using cosine similarity
SELECT id, title, content, 1 - (embedding <=> $1) AS similarity
FROM agent_documents
WHERE agent_type = 'seo_aeo'
ORDER BY embedding <=> $1
LIMIT 10;
```

### Query-Time Parameters

Set `hnsw.ef_search` for better recall (trade-off: slower queries):

```sql
-- Increase search quality for important queries
SET hnsw.ef_search = 100;  -- Default: 40

SELECT id, title, 1 - (embedding <=> $1) AS similarity
FROM agent_documents
ORDER BY embedding <=> $1
LIMIT 10;
```

**Recommendations:**
- `ef_search = 40`: Default, good for most queries
- `ef_search = 100`: Better recall for critical searches
- `ef_search = 200`: Maximum quality (slower)

### Distance Operators

pgvector supports three distance operators:

1. **Cosine Distance** (`<=>`) - **RECOMMENDED**
   - Range: 0 to 2 (0 = identical, 2 = opposite)
   - Best for normalized embeddings (OpenAI embeddings are normalized)
   - Most commonly used for semantic similarity

2. **L2 Distance** (`<->`)
   - Euclidean distance
   - Use when embeddings are not normalized

3. **Inner Product** (`<#>`)
   - Negative inner product
   - Use for maximum inner product search

## Performance Tuning

### Database Configuration

Add to `postgresql.conf` or set per-session:

```sql
-- Increase shared buffers for vector operations (adjust based on RAM)
shared_buffers = 4GB

-- Increase work memory for sorting/hashing
work_mem = 64MB

-- Increase maintenance work memory for index builds
maintenance_work_mem = 1GB

-- Enable parallel query execution
max_parallel_workers_per_gather = 4
```

### Index Maintenance

```sql
-- Rebuild index if data distribution changes significantly
REINDEX INDEX agent_documents_embedding_idx;

-- Update statistics for query planner
ANALYZE agent_documents;
```

### Monitoring Query Performance

```sql
-- Check if index is being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, title, 1 - (embedding <=> $1) AS similarity
FROM agent_documents
ORDER BY embedding <=> $1
LIMIT 10;
```

Look for:
- `Index Scan using agent_documents_embedding_idx` ✅
- `Seq Scan on agent_documents` ❌ (index not used)

## Scaling Considerations

### Small Scale (< 100K vectors)
- Default HNSW parameters work well
- No special tuning needed

### Medium Scale (100K - 1M vectors)
- Increase `m` to 24-32 for better recall
- Increase `ef_construction` to 128
- Monitor memory usage

### Large Scale (> 1M vectors)
- Consider partitioning tables by user_id or category
- Use connection pooling (PgBouncer)
- Consider dedicated vector database (Pinecone, Weaviate) for > 10M vectors

## Code Examples

### TypeScript/Drizzle Usage

```typescript
import { db, agentDocuments } from '@/lib/db'
import { sql } from 'drizzle-orm'

// Similarity search
async function findSimilarDocuments(queryEmbedding: number[], limit = 10) {
  const results = await db.execute(sql`
    SELECT 
      id, 
      title, 
      content,
      1 - (embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) AS similarity
    FROM agent_documents
    WHERE agent_type = 'seo_aeo'
    ORDER BY embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}
    LIMIT ${limit}
  `)
  
  return results.rows
}

// With threshold filtering
async function findSimilarDocumentsWithThreshold(
  queryEmbedding: number[], 
  minSimilarity = 0.7,
  limit = 10
) {
  const results = await db.execute(sql`
    SELECT 
      id, 
      title, 
      content,
      1 - (embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) AS similarity
    FROM agent_documents
    WHERE 
      agent_type = 'seo_aeo'
      AND 1 - (embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) >= ${minSimilarity}
    ORDER BY embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}
    LIMIT ${limit}
  `)
  
  return results.rows
}
```

## Benchmarks

Expected query performance with HNSW indexes:

| Dataset Size | Query Time (p50) | Query Time (p95) | Recall@10 |
|-------------|------------------|------------------|-----------|
| 1K vectors  | < 1ms           | < 2ms            | 99%       |
| 10K vectors | < 5ms           | < 10ms           | 98%       |
| 100K vectors| < 20ms          | < 50ms           | 95%       |
| 1M vectors  | < 100ms         | < 200ms          | 90%       |

*Benchmarks assume m=16, ef_construction=64, ef_search=40*

## Migration Steps

1. **Apply the migration:**
   ```bash
   # Using Drizzle
   npm run db:push
   
   # Or manually
   psql $DATABASE_URL -f drizzle/0001_add_vector_indexes.sql
   ```

2. **Monitor index build progress:**
   ```sql
   SELECT 
     schemaname, 
     tablename, 
     indexname, 
     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
   FROM pg_stat_user_indexes
   WHERE indexname LIKE '%embedding_idx';
   ```

3. **Verify indexes are being used:**
   ```sql
   EXPLAIN (ANALYZE) 
   SELECT * FROM agent_documents 
   ORDER BY embedding <=> '[0,0,...]'::vector 
   LIMIT 10;
   ```

## Troubleshooting

### Index Not Being Used

**Problem:** Query uses sequential scan instead of index

**Solutions:**
1. Check if pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Verify index exists: `\d agent_documents`
3. Update statistics: `ANALYZE agent_documents;`
4. Check query uses correct operator: `<=>` for cosine distance
5. Ensure LIMIT is present (index only used for top-k queries)

### Slow Index Build

**Problem:** Index creation takes too long

**Solutions:**
1. Increase `maintenance_work_mem`: `SET maintenance_work_mem = '2GB';`
2. Build indexes during off-peak hours
3. Consider building indexes in parallel for different tables

### High Memory Usage

**Problem:** Database using too much memory

**Solutions:**
1. Reduce `m` parameter (e.g., m=8 instead of m=16)
2. Reduce `shared_buffers` if necessary
3. Monitor with: `SELECT * FROM pg_stat_activity;`

### Poor Recall

**Problem:** Similarity search returns irrelevant results

**Solutions:**
1. Increase `ef_search`: `SET hnsw.ef_search = 100;`
2. Rebuild index with higher `ef_construction`
3. Check embedding quality (ensure proper normalization)
4. Verify distance operator matches embedding type

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Neon Vector Search](https://neon.tech/docs/extensions/pgvector)

## Next Steps

1. ✅ Apply migration to add vector indexes
2. ✅ Update RAG retrieval code to use indexed queries
3. ⏳ Monitor query performance in production
4. ⏳ Tune `ef_search` based on recall requirements
5. ⏳ Consider partitioning if dataset grows > 1M vectors
