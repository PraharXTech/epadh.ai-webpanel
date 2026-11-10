import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { store } from '@/store';

// Like renderWithProviders, but with the app's REAL store (every slice, the mock services),
// for flows that go through the actual thunks. The store is a singleton, so reset it between
// tests with `store.dispatch(logout())`. `entries` / `index` build a history so "back" works.
export function renderWithRealStore(
  ui,
  { path = '*', entries = ['/'], index } = {},
) {
  const router = createMemoryRouter([{ path, element: ui }], {
    initialEntries: entries,
    initialIndex: index,
  });
  return {
    store,
    router,
    ...render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    ),
  };
}
