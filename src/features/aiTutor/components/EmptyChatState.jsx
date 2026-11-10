import AppIcon from '@/components/common/AppIcon';
import { BRAND } from '@/config/brand';
import QuickPromptChips from './QuickPromptChips';

// First screen of a brand-new conversation: a greeting and the quick prompts, so there is
// something useful to tap before typing anything.
export default function EmptyChatState({ topicName, onPrompt, disabled }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <AppIcon name="bot" size={30} color="#2563eb" />
      </span>
      <h2 className="mt-4 text-center text-lg font-extrabold text-slate-900">
        Hi, main {BRAND.tutorName} hoon
      </h2>
      <p className="mt-1 max-w-md text-center text-sm text-slate-500">
        {topicName
          ? `${topicName} ke baare mein kuch bhi poochho, Hinglish mein samjhaunga.`
          : 'Apni padhai se juda koi bhi sawal poochho, Hinglish mein samjhaunga.'}
      </p>
      <div className="mt-6 w-full max-w-xl">
        <QuickPromptChips onPress={onPrompt} disabled={disabled} center />
      </div>
    </div>
  );
}
