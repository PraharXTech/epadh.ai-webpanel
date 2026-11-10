import AppIcon from '@/components/common/AppIcon';
import banner from '@/assets/images/herobanner.webp';

// The welcome banner. `onStart` resumes the last activity, or opens the syllabus when there
// is none (decided by the page).
export default function HeroBanner({ hero, onStart }) {
  return (
    <section
      aria-label="Welcome"
      className="relative h-[185px] overflow-hidden rounded-3xl bg-sky-100 sm:h-[230px]">
      <img
        src={banner}
        alt=""
        width="1200"
        height="446"
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <div className="relative flex h-full flex-col justify-between p-3 sm:p-5">
        <div className="w-3/5">
          <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium text-blue-600 sm:text-xs">
            <AppIcon name="sparkles" color="#2563eb" size={12} />
            <span className="ml-1">{hero.badge}</span>
          </p>
          <p className="mt-2 text-2xl leading-8 font-extrabold text-slate-900 sm:text-3xl sm:leading-9">
            {hero.title}
            <br />
            with <span className="text-blue-600">{hero.brand}</span>
          </p>
          <p className="mt-1 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">
            {hero.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center self-start rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700">
          <span className="mr-2">{hero.cta}</span>
          <AppIcon name="arrow-right" color="#ffffff" size={16} />
        </button>
      </div>
    </section>
  );
}
