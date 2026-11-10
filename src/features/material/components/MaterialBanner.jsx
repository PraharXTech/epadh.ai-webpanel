import banner from '@/assets/images/herobanner.webp';

// Decorative banner. Swap the image once a study-material specific one exists.
export default function MaterialBanner() {
  return (
    <div className="mx-4 h-24 overflow-hidden rounded-xl bg-sky-100">
      <img
        src={banner}
        alt=""
        className="h-full w-full object-cover"
        width="1200"
        height="446"
      />
    </div>
  );
}
