import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

// Web port of mobile test-utils/render.jsx: renders a page inside a Redux store and a
// memory router, so tests can set the URL and read the resulting location.
//
//   renderWithProviders(<TopicDetailPage />, { route: '/topics/t1', path: '/topics/:topicId' })
//
// `reducer` is the app's combined reducer map (pass only the slices the page reads);
// `preloadedState` seeds them.
export function renderWithProviders(
  ui,
  { reducer = {}, preloadedState, route = '/', path = '*' } = {},
) {
  const store = configureStore({
    reducer,
    preloadedState,
    middleware: getDefault => getDefault({ serializableCheck: false }),
  })
  const router = createMemoryRouter([{ path, element: ui }], {
    initialEntries: [route],
  })
  return { store, router, ...render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  ) }
}
