import { createClient } from 'redis';

let redisClient;
let isRedisConnected = false;

export const initRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    // Retry up to 5 times with a max delay of 2 seconds
                    if (retries > 5) {
                        console.warn("Redis connection retries exceeded. Falling back to MongoDB.");
                        return new Error("Retry time exhausted");
                    }
                    return Math.min(retries * 100, 2000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.warn('Redis Client Error:', err.message);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
            isRedisConnected = true;
        });

        redisClient.on('end', () => {
            isRedisConnected = false;
        });

        await redisClient.connect();
    } catch (error) {
        console.warn('Failed to initialize Redis. APIs will fall back to MongoDB:', error.message);
        isRedisConnected = false;
    }
};

export const getRedisClient = () => redisClient;
export const isRedisAvailable = () => isRedisConnected && redisClient && redisClient.isReady;

// Helper to clear product cache keys
export const clearProductCache = async () => {
    if (!isRedisAvailable()) return;
    try {
        // Clear list cache
        await redisClient.del('cache:products:list');
        
        // Find and clear single product cache keys
        // Note: In production, using SCAN is safer than KEYS, but for a small dataset KEYS is okay.
        // We'll use SCAN to be safe and production-ready.
        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: 'cache:products:single:*',
                COUNT: 100
            });
            cursor = result.cursor;
            const keys = result.keys;
            if (keys && keys.length > 0) {
                await redisClient.del(keys);
            }
        } while (cursor !== 0);
        
        console.log('Product cache invalidated successfully.');
    } catch (error) {
        console.warn('Failed to clear product cache:', error.message);
    }
};
