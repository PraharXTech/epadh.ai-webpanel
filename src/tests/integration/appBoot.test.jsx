import { render, screen } from '@testing-library/react'
import App from '@/App'

// Whole app, real store + real router: splash while the session is restored, then the
// guard sends a logged-out visitor to /login.
describe('app boot', () => {
  it('shows the splash, then lands a logged-out visitor on the login page', async () => {
    window.history.pushState({}, '', '/syllabus')
    render(<App />)

    expect(await screen.findByRole('status', { name: /loading/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Login' }, { timeout: 4000 })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('shows the 404 page for an unknown URL when logged in is not required', async () => {
    window.history.pushState({}, '', '/terms')
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Terms of Service' }, { timeout: 4000 }),
    ).toBeInTheDocument()
  })
})
