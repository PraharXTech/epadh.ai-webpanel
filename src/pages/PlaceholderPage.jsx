import { useLocation } from 'react-router-dom';

// Stand-in for a page that is not ported yet (mobile: PlaceholderScreen). Every route in
// routes/router.jsx points here until its phase lands, so the full URL map is testable
// from day one. Delete the usage in router.jsx as each real page arrives.
export default function PlaceholderPage({ title, mobile, phase }) {
  const { pathname } = useLocation();
  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Not ported yet{phase ? ` (phase ${phase})` : ''}.
        {mobile ? ` Mobile screen: ${mobile}.` : ''}
      </p>
      <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
        {pathname}
      </p>
    </section>
  );
}
