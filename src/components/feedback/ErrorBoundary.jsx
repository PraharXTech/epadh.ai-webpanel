import { Component } from 'react';

// Catches a crash in any page below it so the student sees a recovery screen instead of a
// white page. (The mobile app has no error boundary yet, see plan.md section 9.)
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook for Sentry / the analytics service (W13).
    console.error('Unhandled UI error', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="max-w-sm text-sm text-slate-600">
          The page hit an unexpected error. Your saved progress is safe.
        </p>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}
