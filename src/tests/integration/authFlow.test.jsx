import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { logout } from '@/features/auth/store/authSlice';
import { router } from '@/routes/router';
import { store } from '@/store';
import { selectSelectedExamIds } from '@/store/selectors/userSelectors';

// The whole W3 journey on the real app: login -> OTP -> choose exams -> Home, with the mock
// services (their delays are real here, so waits are generous).
const SLOW = { timeout: 6000 };

const boot = async url => {
  await router.navigate(url);
  render(<App />);
  // splash first, then the guard decides where to go
  await screen.findByRole('status', { name: /loading/i });
};

describe('login, OTP and exam selection', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await router.navigate('/login');
  });

  it('logs a new student in and walks them through choosing an exam', async () => {
    await boot('/login');

    // ---- login page
    const mobile = await screen.findByLabelText('Mobile number', {}, SLOW);
    await userEvent.type(mobile, '98765abc43210');
    expect(mobile).toHaveValue('9876543210'); // digits only, max 10
    await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));

    // ---- OTP page: number shown, button off until 6 digits
    expect(await screen.findByText('Verify OTP', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    const verify = screen.getByRole('button', { name: /Verify & Login/ });
    expect(verify).toBeDisabled();

    // a wrong code (the mock rejects 000000) shows the error and stays here
    const code = screen.getByLabelText('6-digit verification code');
    await userEvent.type(code, '000000');
    await userEvent.click(verify);
    expect(await screen.findByRole('alert', {}, SLOW)).toHaveTextContent(
      'Incorrect OTP',
    );

    // the right code logs in; with no exam yet the guard sends the student to onboarding
    await userEvent.clear(code);
    await userEvent.type(code, '123456');
    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/ }));
    expect(
      await screen.findByRole('heading', { name: 'Choose your exams' }, SLOW),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/onboarding/exam');

    // ---- exam selection: must pick one, then continue to Home
    expect(
      screen.getByRole('button', { name: 'Select at least one exam' }),
    ).toBeDisabled();
    await userEvent.click(await screen.findByRole('checkbox', { name: /UPSSSC PET/ }, SLOW));
    await userEvent.click(screen.getByRole('button', { name: 'Continue (1 selected)' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'), SLOW);
    expect(selectSelectedExamIds(store.getState())).toEqual(['pet']);
  }, 30000);

  it('a student who was sent to login from a deep link lands back on it', async () => {
    // already logged in with an exam, as after a previous visit
    await boot('/login');
    await userEvent.type(await screen.findByLabelText('Mobile number', {}, SLOW), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await userEvent.type(await screen.findByLabelText('6-digit verification code', {}, SLOW), '123456');
    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/ }));
    await screen.findByRole('heading', { name: 'Choose your exams' }, SLOW);
    await userEvent.click(await screen.findByRole('checkbox', { name: /SSC GD/ }, SLOW));
    await userEvent.click(screen.getByRole('button', { name: 'Continue (1 selected)' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'), SLOW);

    // session expires; the student opens a deep link
    store.dispatch(logout());
    await router.navigate('/history');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'), SLOW);
    expect(router.state.location.state.from.pathname).toBe('/history');
  }, 30000);

  it('logs out from onboarding and returns to login', async () => {
    await boot('/login');
    await userEvent.type(await screen.findByLabelText('Mobile number', {}, SLOW), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await userEvent.type(await screen.findByLabelText('6-digit verification code', {}, SLOW), '123456');
    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/ }));
    await screen.findByRole('heading', { name: 'Choose your exams' }, SLOW);

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Log out', hidden: false }, SLOW).then(() => screen.getAllByRole('button', { name: 'Log out' }).at(-1)));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'), SLOW);
    expect(store.getState().auth.isAuthenticated).toBe(false);
  }, 30000);
});
