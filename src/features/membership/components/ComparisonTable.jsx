import AppIcon from '@/components/common/AppIcon';

// Rows straight from the gating matrix (plan.md section 3). A row's `free` / `pro` value is
// either a short label ("Limited", "20 / day") or a boolean, drawn as a check or a dash.
const ROWS = [
  { label: 'Full syllabus', icon: 'book-open', free: 'Limited', pro: 'Full' },
  {
    label: 'Ask epadh.ai (AI tutor)',
    icon: 'bot',
    free: '10 / day',
    pro: 'Extended',
  },
  {
    label: 'Daily practice questions',
    icon: 'file-text',
    free: '20 / day',
    pro: 'Extended',
  },
  { label: 'Advanced mock tests', icon: 'star', free: 'Limited', pro: 'Full' },
  {
    label: 'Weak topic analysis',
    icon: 'chart-column',
    free: false,
    pro: true,
  },
  {
    label: 'Extended practice',
    icon: 'sliders-horizontal',
    free: 'Limited',
    pro: 'Full',
  },
];

function Cell({ value, isPro }) {
  if (typeof value === 'boolean') {
    return value ? (
      <>
        <AppIcon name="check" size={16} color="#16a34a" />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <AppIcon name="close" size={14} color="#cbd5e1" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  if (isPro) {
    return (
      <span className="inline-flex items-center">
        <AppIcon name="circle-check" size={14} color="#16a34a" />
        <span className="ml-1 text-xs font-bold text-slate-700">{value}</span>
      </span>
    );
  }
  return <span className="text-xs font-semibold text-slate-500">{value}</span>;
}

// Free versus Pro, one feature per row.
export default function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Free and Pro plans compared</caption>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th
              scope="col"
              className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">
              Features
            </th>
            <th
              scope="col"
              className="w-20 text-center text-xs font-bold text-slate-500 uppercase sm:w-28">
              Free
            </th>
            <th
              scope="col"
              className="w-20 bg-blue-50 text-center text-xs font-semibold text-blue-600 uppercase sm:w-28">
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={i < ROWS.length - 1 ? 'border-b border-slate-50' : ''}>
              <th scope="row" className="px-4 py-3 text-left font-normal">
                <span className="flex items-center">
                  <AppIcon name={row.icon} size={16} color="#64748b" />
                  <span className="ml-2 text-xs text-slate-700">
                    {row.label}
                  </span>
                </span>
              </th>
              <td className="text-center">
                <Cell value={row.free} />
              </td>
              <td className="bg-blue-50 text-center">
                <Cell value={row.pro} isPro />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
