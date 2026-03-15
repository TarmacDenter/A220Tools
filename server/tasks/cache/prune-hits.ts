import { pruneAllOlderThan, RangeWindow } from '../../utils/storage';

export default defineTask({
  meta: {
    name: "cache:prune-hits",
    description: "Remove stale (> 1 week) airport hits"
  },
  async run() {
    const count = await pruneAllOlderThan(RangeWindow.WEEK);
    console.debug(`[prune-hits] pruned ${count} airport(s)`);
    return { result: `pruned ${count} airports` };
  }
});