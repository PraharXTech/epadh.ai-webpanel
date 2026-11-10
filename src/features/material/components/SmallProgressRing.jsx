import Ring from '@/components/charts/Ring';

// Small ring with the percentage beside it, e.g. watched progress of a video.
export default function SmallProgressRing({ percent }) {
  return (
    <span className="flex items-center">
      <Ring
        percent={percent}
        size={26}
        stroke={4}
        track="#dbeafe"
        label="Progress"
      />
      <span className="ml-1.5 text-xs font-medium text-slate-800">
        {percent}%
      </span>
    </span>
  );
}
