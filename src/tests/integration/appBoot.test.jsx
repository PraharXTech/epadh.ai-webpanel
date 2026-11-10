import { render, screen } from '@testing-library/react';
import App from '@/App';
import { router } from '@/routes/router';

// Whole app, real store + real router: splash while the session is restored, then the
// guard sends a logged-out visitor to /login. The router is a module singleton (as in
// the browser), so each test steers it with router.navigate before rendering.
describe('app boot', () => {
  it('shows the splash, then lands a logged-out visitor on the login page', async () => {
    await router.navigate('/syllabus');
    render(<App />);

    expect(
      await screen.findByRole('status', { name: /loading/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Welcome Back!' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('lets a logged-out visitor read the public Terms page', async () => {
    await router.navigate('/terms');
    render(<App />);
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Terms of Service' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
  });

  it('shows the 404 page for an unknown URL', async () => {
    await router.navigate('/no/such/page');
    render(<App />);
    expect(
      await screen.findByText('Page not found', {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });
});
