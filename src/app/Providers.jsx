import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PersistGate } from 'redux-persist/integration/react';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import { router } from '@/routes/router';
import { persistor, store } from '@/store';
import AlertHost from './AlertHost';
import BootGate from './BootGate';

// Everything the app needs above the router, in one place:
// error boundary > Redux > saved state restored > splash/session restore > router.
export default function Providers() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <BootGate>
            <RouterProvider router={router} />
          </BootGate>
          <AlertHost />
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
