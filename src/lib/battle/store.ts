import { Redis } from "@upstash/redis";

// Accepts either a plain Upstash account's env var names, or Vercel's Upstash
// marketplace integration, which names them KV_REST_API_URL / KV_REST_API_TOKEN.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "No Redis env vars found (checked UPSTASH_REDIS_REST_URL/TOKEN and KV_REST_API_URL/TOKEN) - battle mode " +
      "is using an in-memory store that will NOT work correctly across multiple serverless instances. Add a Redis database for production."
  );
}

/** In-memory fallback so battle mode works in local dev without any Redis setup. */
const memory = new Map<string, string>();
const memoryLocks = new Map<string, number>();

const ROOM_TTL_SECONDS = 60 * 60 * 2;

export async function getJSON<T>(key: string): Promise<T | null> {
  if (redis) {
    const value = await redis.get<T>(key);
    return value ?? null;
  }
  const raw = memory.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: ROOM_TTL_SECONDS });
    return;
  }
  memory.set(key, JSON.stringify(value));
}

export async function getString(key: string): Promise<string | null> {
  if (redis) {
    const value = await redis.get<string>(key);
    return value ?? null;
  }
  return memory.get(key) ?? null;
}

export async function setString(key: string, value: string): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: ROOM_TTL_SECONDS });
    return;
  }
  memory.set(key, value);
}

/** Short-lived best-effort lock so concurrent polling requests don't duplicate slow work. */
export async function acquireLock(key: string, ttlSeconds = 25): Promise<boolean> {
  if (redis) {
    const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
    return result === "OK";
  }
  const now = Date.now();
  const expiry = memoryLocks.get(key);
  if (expiry && expiry > now) return false;
  memoryLocks.set(key, now + ttlSeconds * 1000);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryLocks.delete(key);
}
