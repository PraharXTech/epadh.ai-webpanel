import AppIcon from '@/components/common/AppIcon';
import SectionHeader from '@/components/common/SectionHeader';
import { PATHS } from '@/routes/routePaths';

const formatCount = n =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;

export default function PopularExams({ exams }) {
  return (
    <section aria-label="Popular exams">
      <SectionHeader
        title="Popular Exams"
        actionLabel="View All"
        actionTo={PATHS.examSelect}
      />
      <ul className="grid grid-cols-5 gap-2">
        {exams.map(e => (
          <li
            key={e.id}
            className="flex h-[76px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-1">
            <span className="mb-1">
              <AppIcon name={e.icon} color={e.color} size={24} />
            </span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-slate-800">
              {e.name}
            </span>
            {e.testCount ? (
              <span className="text-center text-[9px] text-slate-400">
                {`${formatCount(e.testCount)} tests`}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
