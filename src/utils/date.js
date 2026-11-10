// Local calendar day as "2026-09-25". Used to bucket things per day (daily limits,
// study time, streak). The server computes the streak in IST; this is for on-screen use.
export const dayKey = (date = new Date()) => {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};
