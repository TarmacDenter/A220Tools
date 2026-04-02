import upstashDriver from 'unstorage/drivers/upstash';
import redisDriver from 'unstorage/drivers/redis';

export default defineNitroPlugin(() => {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    useStorage().mount('hits', upstashDriver({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }));
    console.log('[storage] using upstash driver');
  } else if (process.env.REDIS_URL) {
    useStorage().mount('hits', redisDriver({ url: process.env.REDIS_URL }));
    console.log('[storage] using redis driver');
  } else {
    console.log('[storage] using memory driver');
  }
});
