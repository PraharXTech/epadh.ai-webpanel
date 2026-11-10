import AppIcon from '@/components/common/AppIcon';

// "Start Mock Test" hero for the top of the Tests hub. Mobile has it commented out, so the
// hub does not use it by default; kept for parity and for wider layouts.
export default function TestsHero({ onStart }) {
  return (
    <section className="mx-4 mt-2 overflow-hidden rounded-3xl bg-amber-50 p-4">
      <div className="flex items-center">
        <div className="flex-1 pr-3">
          <h2 className="text-xl leading-7 font-extrabold text-slate-900">
            Boost Your Preparation
            <br />
            with Test Practice
          </h2>
          <p className="mt-1.5 text-xs leading-4 text-slate-600">
            Attempt full-length mock tests, chapter-wise tests and more.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-3 inline-flex items-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600">
            <span className="mr-2">Start Mock Test</span>
            <AppIcon name="arrow-right" size={16} color="#ffffff" />
          </button>
        </div>
        <span
          aria-hidden="true"
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
          <AppIcon name="clipboard-check" size={40} color="#d97706" />
        </span>
      </div>
    </section>
  );
}
