import upstashDriver from 'unstorage/drivers/upstash';

export default defineNitroPlugin(() => {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    useStorage().mount('hits', upstashDriver({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }));
    console.log('[storage] using upstash driver');
  } else {
    console.log('[storage] using memory driver');
  }
});
