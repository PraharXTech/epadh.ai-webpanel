import AppIcon from '@/components/common/AppIcon';

// Available / Attempted / Average Score / Rank, worked out from the student's own data (no
// invented numbers). Rank has no per-exam source yet, so it stays "—" and explains itself
// when pressed.
export default function TestsStatsRow({ stats, onRankPress }) {
  const tiles = [
    {
      id: 'available',
      icon: 'file-text',
      color: '#2563eb',
      value: stats.available,
      label: 'Available Tests',
    },
    {
      id: 'attempted',
      icon: 'circle-check',
      color: '#16a34a',
      value: stats.attempted,
      label: 'Tests Attempted',
    },
    {
      id: 'score',
      icon: 'chart-column',
      color: '#ea580c',
      value: stats.averageScore === null ? '—' : `${stats.averageScore}%`,
      label: 'Average Score',
    },
    {
      id: 'rank',
      icon: 'trophy',
      color: '#7c3aed',
      value: '—',
      label: 'Rank in Batch',
      onPress: onRankPress,
    },
  ];
  return (
    <ul className="mx-4 mt-3 flex rounded-2xl bg-white p-3 shadow-sm">
      {tiles.map((tile, i) => {
        const inner = (
          <>
            <AppIcon name={tile.icon} size={18} color={tile.color} />
            <span className="mt-1 text-base font-extrabold text-slate-900">
              {tile.value}
            </span>
            <span className="text-center text-[10px] text-slate-500 sm:text-xs">
              {tile.label}
            </span>
          </>
        );
        const cls = `flex w-full flex-col items-center px-1 ${
          i > 0 ? 'border-l border-slate-200' : ''
        }`;
        return (
          <li key={tile.id} className="flex flex-1">
            {tile.onPress ? (
              <button
                type="button"
                onClick={tile.onPress}
                className={`${cls} rounded-lg hover:bg-slate-50`}>
                {inner}
              </button>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
