import { Link } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import { PATHS } from '@/routes/routePaths';

// Shortcut to the AI OMR scanner, right under the hero banner. A bold blue card so it reads
// as a feature, kept to one compact row.
export default function OmrScannerCard() {
  return (
    <Link
      to={PATHS.omr}
      aria-label="Open OMR scanner"
      className="relative flex items-center overflow-hidden rounded-2xl bg-blue-700 px-3 py-2.5 shadow-md transition-opacity hover:opacity-90">
      <span
        aria-hidden="true"
        className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-8 left-24 h-16 w-16 rounded-full bg-sky-400/20"
      />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/20">
        <AppIcon name="scan" size={24} color="#ffffff" />
      </span>
      <span className="relative ml-3 min-w-0 flex-1">
        <span className="flex items-center">
          <span className="text-base font-extrabold text-white">
            AI OMR Scanner
          </span>
          <span className="ml-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-950">
            FREE
          </span>
        </span>
        <span className="block truncate text-xs text-blue-100">
          Get your score, rank and answer review
        </span>
      </span>
      <span className="relative ml-2 flex items-center rounded-full bg-white px-3 py-1.5">
        <span className="mr-1 text-xs font-bold text-blue-700">Scan</span>
        <AppIcon name="arrow-right" size={14} color="#1d4ed8" />
      </span>
    </Link>
  );
}
