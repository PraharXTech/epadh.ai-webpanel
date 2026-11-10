// White rounded surface used by every dashboard block. `as` lets a card be a link or
// button wrapper without nesting interactive elements.
export default function Card({
  as: Tag = 'div',
  padded = true,
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        padded ? 'p-4' : ''
      } ${className}`}
      {...rest}>
      {children}
    </Tag>
  );
}
