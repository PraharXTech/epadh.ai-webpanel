import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/routePaths';

// Is there an earlier page of THIS app to go back to?
//   Browser router: React Router keeps the position of each entry in `history.state.idx`
//   (0 = the first page of this document). Anything above 0 has a page behind it.
//   In-memory router (tests): there is no window history, so fall back to the location key,
//   which is "default" only for the very first entry.
// Do not use `location.key === "default"` on its own: it turns false as soon as the first page
// is replaced (setup -> session), although there is still nothing behind it.
const hasPageBehind = location => {
  const index = window.history.state?.idx;
  return typeof index === 'number' ? index > 0 : location.key !== 'default';
};

// Back button behaviour for every page: one step back when there is a page of this app behind
// (so the browser history stays natural), otherwise go to `fallback` (a shared link, a reload on
// a deep URL), never out of the site. The returned function may be given a different fallback
// when it is only known at click time.
//   const goBack = useGoBack(PATHS.syllabus);   <button onClick={() => goBack()}>
export default function useGoBack(fallback = PATHS.home) {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (override = fallback) => {
      if (hasPageBehind(location)) {
        navigate(-1);
      } else {
        navigate(override, { replace: true });
      }
    },
    [navigate, location, fallback],
  );
}
