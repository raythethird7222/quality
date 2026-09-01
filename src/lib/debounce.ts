// Client-side utilities for coalescing rapid events.

// Returns a debounced version of `fn` that waits `waitMs` after the last
// invocation before calling `fn`. Used to coalesce bursts of Supabase Realtime
// events into a single refetch, avoiding request storms.
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}
