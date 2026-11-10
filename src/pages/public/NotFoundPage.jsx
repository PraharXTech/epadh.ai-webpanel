import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/routePaths';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-extrabold text-blue-600">404</p>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to={PATHS.home}
        className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
        Go to Home
      </Link>
    </div>
  );
}
