import AppIcon from '@/components/common/AppIcon';

// "100 Qs · 60 Min · 200 Marks" with a small icon before each.
export default function MetaRow({ test, small = false, className = '' }) {
  const items = [
    { icon: 'file-text', text: `${test.questions} Qs` },
    { icon: 'clock', text: `${test.minutes} Min` },
    { icon: 'trophy', text: `${test.marks} Marks` },
  ];
  return (
    <ul className={`flex items-center justify-between ${className}`}>
      {items.map(i => (
        <li key={i.icon} className="flex items-center">
          <AppIcon name={i.icon} size={small ? 11 : 13} color="#64748b" />
          <span
            className={`${
              small ? 'ml-0.5 text-[10px]' : 'ml-1 text-xs'
            } text-slate-600`}>
            {i.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
