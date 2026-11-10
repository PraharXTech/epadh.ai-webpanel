// Full-area spinner for a page that has nothing to show yet and no skeleton.
export default function ScreenLoader() {
  return (
    <div className="flex min-h-[50dvh] flex-1 items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
      />
    </div>
  );
}
