import { useEffect, useState } from 'react';
import { subscribePageVisibility } from '@/services/page/visibility';
import { dayKey } from '@/utils/date';

// Today's date key ("2026-09-25") that CHANGES by itself: at midnight while the page is open,
// and when a hidden tab is shown again after a night. Without it a page left open overnight
// would keep saying yesterday's streak. (Mobile has the same limit: "moves on at the next
// study activity or refresh rather than at midnight".)
export default function useToday() {
  const [today, setToday] = useState(() => dayKey());

  useEffect(() => {
    let timer;
    const check = () => setToday(dayKey());
    const scheduleMidnight = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      );
      timer = setTimeout(() => {
        check();
        scheduleMidnight();
      }, midnight - now);
    };
    scheduleMidnight();
    const unsubscribe = subscribePageVisibility(visible => {
      if (visible) {
        check();
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return today;
}
