import AppIcon from './AppIcon';

export default function BrandLogo({ size = 40 }) {
  return (
    <span className="inline-flex items-center">
      <AppIcon name="graduation-cap" color="#2563eb" size={size} />
      <span
        className="ml-2 font-extrabold text-slate-900"
        style={{ fontSize: size * 0.6 }}>
        epadh<span className="text-blue-600">.ai</span>
      </span>
    </span>
  );
}
