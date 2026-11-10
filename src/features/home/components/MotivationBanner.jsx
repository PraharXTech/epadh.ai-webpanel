import AppIcon from '@/components/common/AppIcon';

export default function MotivationBanner({ message }) {
  return (
    <aside className="flex items-center rounded-2xl bg-green-100 px-4 py-4">
      <span className="mr-3" aria-hidden="true">
        <AppIcon name="trophy" color="#15803d" size={32} />
      </span>
      <p className="font-semibold leading-5 text-green-800">{message}</p>
    </aside>
  );
}
