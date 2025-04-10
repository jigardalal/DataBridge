### 2025-04-10

- Fixed Redis connection errors during local development by:
  - Adding a DISABLE_REDIS flag to CacheManager.js
  - Setting DISABLE_REDIS=true in .env.development
  - Confirmed Redis is not required for /api/mappings/customer endpoint
  - Now backend runs without Redis and without connection errors
