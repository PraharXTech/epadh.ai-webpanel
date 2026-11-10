import { useEffect, useRef, useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import MessageText from './MessageText';

const timeOf = ts =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Writes to the clipboard. The modern API needs a secure page (https or localhost); the old
// textarea trick covers the rest. Resolves false when neither works.
const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand?.('copy') ?? false;
    area.remove();
    return ok;
  }
};

// One chat bubble. AI bubbles get a small avatar dot, a Copy action and thumbs up / down
// feedback (plan.md section 5.8); user bubbles are the mirror, plain blue.
export default function ChatBubble({ message, onRate }) {
  const isAi = message.role === 'ai';
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    if (await copyText(message.text)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <li className={`mb-3 flex px-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      {isAi ? (
        <span
          aria-hidden="true"
          className="mt-1 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
          <AppIcon name="bot" size={15} color="#ffffff" />
        </span>
      ) : null}

      <div
        className={`max-w-[85%] sm:max-w-[75%] ${isAi ? '' : 'flex flex-col items-end'}`}>
        <span className="sr-only">{isAi ? 'epadh.ai said:' : 'You said:'}</span>
        <div
          className={`overflow-hidden rounded-2xl ${
            message.imageUri ? '' : 'px-4 py-3'
          } ${
            isAi
              ? 'rounded-tl-sm bg-white shadow-sm'
              : 'rounded-tr-sm bg-blue-600'
          }`}>
          {message.imageUri ? (
            <img
              src={message.imageUri}
              alt="Photo you sent"
              className="h-40 w-56 object-cover"
            />
          ) : null}
          {message.text ? (
            isAi ? (
              <div className={message.imageUri ? 'px-4 py-3' : ''}>
                <MessageText
                  text={message.text}
                  className="text-sm leading-5 text-slate-800"
                />
              </div>
            ) : (
              <p
                className={`text-sm leading-5 whitespace-pre-wrap text-white ${
                  message.imageUri ? 'px-4 py-3' : ''
                }`}>
                {message.text}
              </p>
            )
          ) : null}
        </div>

        <div className="mt-1 flex items-center px-1">
          <span className="text-[10px] text-slate-400">
            {timeOf(message.createdAt)}
          </span>
          {isAi ? (
            <>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy answer"
                className="ml-3 rounded p-1 hover:bg-slate-100">
                {copied ? (
                  <AppIcon name="check" size={13} color="#16a34a" />
                ) : (
                  <AppIcon name="copy" size={13} color="#94a3b8" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onRate?.(message.id, 'up')}
                aria-label="Good answer"
                aria-pressed={message.rating === 'up'}
                className="ml-1 rounded p-1 hover:bg-slate-100">
                <AppIcon
                  name="thumbs-up"
                  size={13}
                  color={message.rating === 'up' ? '#2563eb' : '#94a3b8'}
                />
              </button>
              <button
                type="button"
                onClick={() => onRate?.(message.id, 'down')}
                aria-label="Poor answer"
                aria-pressed={message.rating === 'down'}
                className="ml-1 rounded p-1 hover:bg-slate-100">
                <AppIcon
                  name="thumbs-down"
                  size={13}
                  color={message.rating === 'down' ? '#dc2626' : '#94a3b8'}
                />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}
