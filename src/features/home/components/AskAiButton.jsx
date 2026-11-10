import { Link } from 'react-router-dom';
import aiIcon from '@/assets/icons/ai-icon.webp';
import { PATHS } from '@/routes/routePaths';

// Floating "Ask epadh.ai" button, bottom right, above the phone tab bar. (Mobile let the
// student drag it around because it can cover content; on the web it is a plain fixed link,
// small enough not to, and moving it would break keyboard use.)
export default function AskAiButton() {
  return (
    <Link
      to={PATHS.ask}
      aria-label="Ask epadh.ai"
      className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 transition-transform hover:scale-105 lg:right-6 lg:bottom-6">
      <img src={aiIcon} alt="" width="64" height="64" className="h-16 w-16" />
    </Link>
  );
}
