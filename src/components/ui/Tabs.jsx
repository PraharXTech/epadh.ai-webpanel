import { useId } from 'react';

// Accessible tab strip (arrow keys, Home / End). It only draws the tabs: render the active
// panel yourself, wrapped in <TabPanel> so the ARIA links work.
//   <Tabs id="topic" items={[{ id: 'material', label: 'Study Material' }]} value={tab} onChange={setTab} />
//   <TabPanel tabsId="topic" id="material" value={tab}>...</TabPanel>
const tabDomId = (tabsId, id) => `${tabsId}-tab-${id}`;
const panelDomId = (tabsId, id) => `${tabsId}-panel-${id}`;

export default function Tabs({
  id,
  items,
  value,
  onChange,
  label,
  variant = 'underline',
  className = '',
}) {
  const autoId = useId();
  const tabsId = id ?? autoId;

  const onKeyDown = (event, index) => {
    const last = items.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) {
      return;
    }
    event.preventDefault();
    onChange(items[target].id);
    document.getElementById(tabDomId(tabsId, items[target].id))?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex ${
        variant === 'underline'
          ? 'border-b border-slate-200'
          : 'gap-1 rounded-full bg-slate-100 p-1'
      } ${className}`}>
      {items.map((item, index) => {
        const selected = item.id === value;
        const base =
          'flex min-h-10 flex-1 items-center justify-center gap-1.5 px-3 text-sm font-semibold transition-colors';
        const look =
          variant === 'underline'
            ? `border-b-2 ${
                selected
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            : `rounded-full ${
                selected ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`;
        return (
          <button
            key={item.id}
            id={tabDomId(tabsId, item.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelDomId(tabsId, item.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={event => onKeyDown(event, index)}
            className={`${base} ${look}`}>
            {item.label}
            {item.count != null ? (
              <span className="text-xs font-normal opacity-70">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ tabsId, id, value, children, className = '' }) {
  if (id !== value) {
    return null;
  }
  return (
    <div
      role="tabpanel"
      id={panelDomId(tabsId, id)}
      aria-labelledby={tabDomId(tabsId, id)}
      className={className}>
      {children}
    </div>
  );
}
