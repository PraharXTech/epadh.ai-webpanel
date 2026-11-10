import { useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import { PATHS } from '@/routes/routePaths';
import { buildQuestionPrompt } from '../utils/questionPrompt';

// "Ask epadh.ai" under a reviewed question: opens a fresh chat that already asks about it.
// (Pulled forward from W7: the practice and mock result pages need it.) The prompt is long,
// so it travels in router state rather than the URL; the chat page (W7) reads
// `location.state.initialPrompt`. After a reload the state is gone and the chat opens empty.
export default function AskAiQuestionButton({ item, topicId, topicName }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate(PATHS.ask, {
          state: {
            topicId,
            topicName,
            initialPrompt: buildQuestionPrompt(item),
          },
        })
      }
      className="mt-3 flex items-center rounded-full bg-violet-50 px-3 py-1.5 hover:bg-violet-100">
      <AppIcon name="bot" size={14} color="#7c3aed" />
      <span className="ml-1.5 text-xs font-bold text-violet-700">
        Ask epadh.ai
      </span>
    </button>
  );
}
