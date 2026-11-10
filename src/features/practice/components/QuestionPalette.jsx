import { questionState } from '../utils/scoring';

const STYLE = {
  answered: 'bg-green-500 text-white',
  marked: 'bg-amber-400 text-white',
  current: 'bg-blue-600 text-white',
  unanswered: 'bg-slate-200 text-slate-700',
};
const SWATCH = {
  answered: 'bg-green-500',
  marked: 'bg-amber-400',
  current: 'bg-blue-600',
  unanswered: 'bg-slate-200',
};
const NAME = {
  answered: 'answered',
  marked: 'marked for review',
  current: 'current',
  unanswered: 'not answered',
};
const LEGEND = [
  ['answered', 'Answered'],
  ['marked', 'Marked'],
  ['current', 'Current'],
  ['unanswered', 'Not answered'],
];

// The grid of question numbers with their state (answered / marked / current / not answered),
// a legend and the submit button. Shown beside the question on desktop and in a sheet on
// phones. `onJump(index)` goes to a question; `onSubmit` asks to finish.
export default function QuestionPalette({
  session,
  isPractice,
  onJump,
  onSubmit,
}) {
  return (
    <div>
      <ul className="grid grid-cols-5 gap-2">
        {session.questions.map((q, index) => {
          const state = questionState(session, q, index);
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-label={`Question ${index + 1}, ${NAME[state]}`}
                aria-current={state === 'current' ? 'true' : undefined}
                className={`flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold ${STYLE[state]}`}>
                {index + 1}
              </button>
            </li>
          );
        })}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND.map(([state, label]) => (
          <li key={state} className="flex items-center">
            <span
              aria-hidden="true"
              className={`mr-1.5 h-3 w-3 rounded ${SWATCH[state]}`}
            />
            <span className="text-xs text-slate-600">{label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSubmit}
        className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700">
        {isPractice ? 'Finish practice' : 'Submit test'}
      </button>
    </div>
  );
}
