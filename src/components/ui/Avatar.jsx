// Profile picture, or the first letter of the name on a blue disc when there is none.
export default function Avatar({ name = '', src, size = 40, className = '' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s photo` : 'Profile photo'}
        style={style}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name || 'Profile'}
      style={style}
      className={`inline-flex items-center justify-center rounded-full bg-blue-600 font-bold text-white ${className}`}>
      {initial}
    </span>
  );
}
