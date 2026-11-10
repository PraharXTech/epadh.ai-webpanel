import AppIcon from '@/components/common/AppIcon';

// "epadh.ai is typing…" bubble shown while a reply is on the way.
export default function TypingBubble() {
  return (
    <li
      role="status"
      aria-label="epadh.ai is typing"
      className="mb-3 flex justify-start px-4">
      <span
        aria-hidden="true"
        className="mt-1 mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
        <AppIcon name="bot" size={15} color="#ffffff" />
      </span>
      <span
        aria-hidden="true"
        className="flex items-center rounded-2xl rounded-tl-sm bg-white px-4 py-3.5 shadow-sm">
        {[0, 120, 240].map(delay => (
          <span
            key={delay}
            className="mx-0.5 h-2 w-2 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </li>
  );
}
