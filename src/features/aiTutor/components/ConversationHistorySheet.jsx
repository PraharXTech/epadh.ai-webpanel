import AppIcon from '@/components/common/AppIcon';
import BottomSheet from '@/features/material/components/BottomSheet';

const lastLine = conversation => {
  const last = conversation.messages[conversation.messages.length - 1];
  return last ? last.text.split('\n')[0] : 'No messages yet';
};

// Conversation history list (plan.md section 5.8) as a sheet: pick one to reopen it, or start
// a new chat. A dedicated page can replace it later if the list grows long enough to need
// search or paging (the app keeps the 20 most recent chats).
export default function ConversationHistorySheet({
  visible,
  conversations,
  activeId,
  onClose,
  onOpen,
  onNew,
  onDelete,
}) {
  return (
    <BottomSheet visible={visible} title="Your conversations" onClose={onClose}>
      <button
        type="button"
        onClick={onNew}
        className="mb-2 flex w-full items-center rounded-xl bg-blue-50 px-3 py-3 hover:bg-blue-100">
        <AppIcon name="plus" size={16} color="#2563eb" />
        <span className="ml-2 text-sm font-semibold text-blue-700">
          New chat
        </span>
      </button>

      {conversations.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No conversations yet.
        </p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {conversations.map(c => (
            <li
              key={c.id}
              className={`mb-1 flex items-center rounded-xl ${
                c.id === activeId ? 'bg-slate-100' : ''
              }`}>
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                aria-current={c.id === activeId ? 'true' : undefined}
                className="min-w-0 flex-1 rounded-xl px-3 py-3 text-left hover:bg-slate-50">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {c.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {lastLine(c)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c)}
                aria-label={`Delete chat ${c.title}`}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-red-50">
                <AppIcon name="trash" size={17} color="#dc2626" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
