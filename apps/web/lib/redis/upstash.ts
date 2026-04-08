import 'server-only'

import { redis } from '@/lib/redis/client'

/**
 * Returns the Redis client singleton.
 * Import path @/lib/redis/upstash matches the spec's import statement.
 */
export function getRedis() {
  return redis
}
