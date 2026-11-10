import AppIcon from '@/components/common/AppIcon';

// Round coloured icon of a subject.
export default function SubjectBadge({ subject, size = 'md' }) {
  const box = size === 'sm' ? 'h-7 w-7' : 'h-10 w-10';
  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-full ${subject.bg}`}>
      <AppIcon
        name={subject.icon}
        color={subject.color}
        size={size === 'sm' ? 14 : 20}
      />
    </span>
  );
}
