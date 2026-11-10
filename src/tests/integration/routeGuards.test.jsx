import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { OnboardingOnly, PublicOnly, RequireAuth, RequireExam, RequireFlow } from '@/routes/guards'

// Same guard tree as routes/router.jsx, with one-word pages so each rule is visible.
const routes = [
  { element: <PublicOnly />, children: [{ path: '/login', element: <p>login page</p> }] },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <OnboardingOnly />,
        children: [{ path: '/onboarding/exam', element: <p>pick exam page</p> }],
      },
      {
        element: <RequireExam />,
        children: [
          { path: '/', element: <p>home page</p> },
          {
            element: <RequireFlow selector={s => s.flow.active} to="/" />,
            children: [{ path: '/session', element: <p>session page</p> }],
          },
        ],
      },
    ],
  },
]

const renderAt = (url, { authed = false, examId = null, flow = false } = {}) => {
  const store = configureStore({
    reducer: {
      auth: (s = { isAuthenticated: authed }) => s,
      user: (s = { selectedExamIds: examId ? [examId] : [], selectedExamId: examId }) => s,
      flow: (s = { active: flow }) => s,
    },
  })
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return router
}

describe('route guards', () => {
  it('sends a logged-out visitor from the app to /login', () => {
    const router = renderAt('/')
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('remembers the page they wanted', () => {
    const router = renderAt('/session')
    expect(router.state.location.state.from.pathname).toBe('/session')
  })

  it('sends a logged-in student without an exam to onboarding', () => {
    renderAt('/', { authed: true })
    expect(screen.getByText('pick exam page')).toBeInTheDocument()
  })

  it('lets a student with an exam into the app', () => {
    renderAt('/', { authed: true, examId: 'pet' })
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('keeps a student with an exam out of onboarding and login', () => {
    renderAt('/onboarding/exam', { authed: true, examId: 'pet' })
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('bounces a logged-in student off /login', () => {
    renderAt('/login', { authed: true, examId: 'pet' })
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('redirects a flow page opened without flow state', () => {
    renderAt('/session', { authed: true, examId: 'pet', flow: false })
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('shows a flow page when its state exists', () => {
    renderAt('/session', { authed: true, examId: 'pet', flow: true })
    expect(screen.getByText('session page')).toBeInTheDocument()
  })
})
