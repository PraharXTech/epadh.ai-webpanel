import { getGreeting } from '@/utils/greeting';

export default function GreetingSection({ name }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{getGreeting()},</p>
      <h1 className="text-xl font-bold text-slate-900">
        {name ?? 'Student'} <span aria-hidden="true">👋</span>
      </h1>
    </div>
  );
}
