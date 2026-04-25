import { pruneAllOlderThan, RangeWindow } from '../../utils/storage';

export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET;
  const auth = getRequestHeader(event, 'authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const count = await pruneAllOlderThan(RangeWindow.WEEK);
  console.debug(`[prune-hits] pruned ${count} airport(s) via cron`);
  return { pruned: count };
});
