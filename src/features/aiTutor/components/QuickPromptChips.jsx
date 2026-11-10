import { QUICK_PROMPTS } from '../utils/quickPrompts';

// Canned follow-up chips under the last AI message and on the empty state (plan.md section 11).
export default function QuickPromptChips({
  onPress,
  disabled,
  center = false,
}) {
  return (
    <ul
      aria-label="Quick questions"
      className={`flex gap-2 overflow-x-auto px-4 pb-1 ${
        center ? 'flex-wrap justify-center' : ''
      }`}>
      {QUICK_PROMPTS.map(prompt => (
        <li key={prompt.id} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPress(prompt)}
            className={`rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 ${
              disabled ? 'opacity-40' : 'hover:bg-blue-100'
            }`}>
            {prompt.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
