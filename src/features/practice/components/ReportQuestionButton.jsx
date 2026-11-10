import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '@/components/common/AppIcon';
import { selectReportedQuestions } from '@/store/selectors/practiceSelectors';
import { reportQuestion } from '../store/practiceSlice';

// "Report wrong question": the safety valve for AI-generated questions.
export default function ReportQuestionButton({ questionId }) {
  const dispatch = useDispatch();
  const reported = Boolean(useSelector(selectReportedQuestions)[questionId]);

  return (
    <button
      type="button"
      onClick={() =>
        dispatch(reportQuestion({ questionId, reason: 'wrong-question' }))
      }
      disabled={reported}
      className="mt-3 flex items-center py-1">
      <AppIcon name="flag" size={13} color={reported ? '#94a3b8' : '#dc2626'} />
      <span
        className={`ml-1.5 text-xs font-semibold ${
          reported ? 'text-slate-400' : 'text-red-600'
        }`}>
        {reported ? 'Reported, thanks' : 'Report wrong question'}
      </span>
    </button>
  );
}
