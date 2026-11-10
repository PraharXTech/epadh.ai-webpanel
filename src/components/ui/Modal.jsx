import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// `placement`:
//   center  dialog in the middle (confirmations, alerts)
//   bottom  sheet from the bottom on phones, centered dialog from 640 px up (mobile BottomSheet)
//   right   side drawer (filters, conversation history)
const WRAPPER = {
  center: 'items-center justify-center p-4',
  bottom: 'items-end justify-center sm:items-center sm:p-4',
  right: 'items-stretch justify-end',
};
const PANEL = {
  center: 'w-full max-w-sm rounded-3xl',
  bottom: 'w-full max-h-[90dvh] rounded-t-3xl sm:max-w-md sm:rounded-3xl',
  right: 'h-full w-full max-w-md overflow-y-auto',
};

// Modal dialog with what a keyboard and screen-reader user need: focus moves in, Tab stays
// inside, Escape closes, focus returns to where it was, the page behind stops scrolling.
// Set `dismissible={false}` for flows that must be answered (payment in progress).
export default function Modal({
  open,
  onClose,
  title,
  placement = 'center',
  dismissible = true,
  className = '',
  children,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => [...panel.querySelectorAll(FOCUSABLE)];
    (
      panel.querySelector('[data-autofocus]') ??
      focusables()[0] ??
      panel
    ).focus();

    const onKeyDown = event => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) {
    return null;
  }
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${WRAPPER[placement]}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/50"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative bg-white shadow-xl outline-none ${PANEL[placement]} ${className}`}>
        {title ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
