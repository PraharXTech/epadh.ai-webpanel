import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import OtpInput from '@/features/auth/components/OtpInput';
import GoogleButton from '@/features/auth/components/GoogleButton';
import useCountdown from '@/features/auth/hooks/useCountdown';
import OtpPage from '@/features/auth/pages/OtpPage';
import { renderHook } from '@testing-library/react';

// `config/env` values are constants, so the Google button's modes are tested by swapping the
// module for one whose values the test controls.
const env = vi.hoisted(() => ({ USE_MOCK_API: true, GOOGLE_CLIENT_ID: '' }));
vi.mock('@/config/env', async importOriginal => ({
  ...(await importOriginal()),
  get USE_MOCK_API() {
    return env.USE_MOCK_API;
  },
  get GOOGLE_CLIENT_ID() {
    return env.GOOGLE_CLIENT_ID;
  },
}));

describe('OtpInput', () => {
  function Harness({ initial = '' }) {
    const [value, setValue] = useState(initial);
    return <OtpInput value={value} onChange={setValue} length={6} />;
  }

  it('is one labelled input that autofills from SMS', () => {
    render(<Harness />);
    const input = screen.getByLabelText('6-digit verification code');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('keeps only digits and stops at the length', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('6-digit verification code');
    await userEvent.type(input, '12ab34-56789');
    expect(input).toHaveValue('123456');
  });

  it('accepts a pasted code', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByLabelText('6-digit verification code'));
    await userEvent.paste('482 915');
    expect(screen.getByLabelText('6-digit verification code')).toHaveValue(
      '482915',
    );
  });

  it('draws each typed digit in its own box', async () => {
    const { container } = render(<Harness initial="4829" />);
    const boxes = [
      ...container.querySelectorAll('[aria-hidden="true"] > div'),
    ].map(b => b.textContent);
    expect(boxes).toEqual(['4', '8', '2', '9', '', '']);
  });

  it('is focused on arrival so the student can type at once', () => {
    render(<Harness />);
    expect(screen.getByLabelText('6-digit verification code')).toHaveFocus();
  });
});

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('counts down to zero and can restart', () => {
    const { result } = renderHook(() => useCountdown(3));
    expect(result.current.seconds).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(0);
    act(() => result.current.restart());
    expect(result.current.seconds).toBe(3);
  });
});

describe('GoogleButton', () => {
  afterEach(() => {
    env.USE_MOCK_API = true;
    env.GOOGLE_CLIENT_ID = '';
    delete window.google;
  });

  it('mock mode: our own button calls onPress', async () => {
    const onPress = vi.fn();
    render(<GoogleButton onPress={onPress} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a busy state while signing in', () => {
    render(<GoogleButton loading />);
    const button = screen.getByRole('button', { name: /Signing in/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('real mode without a client id is disabled and says why', () => {
    env.USE_MOCK_API = false;
    render(<GoogleButton onPress={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeDisabled();
    expect(screen.getByText(/not set up yet/)).toBeInTheDocument();
  });

  it("real mode with a client id renders Google's button and forwards the ID token", async () => {
    env.USE_MOCK_API = false;
    env.GOOGLE_CLIENT_ID = 'client-123.apps.googleusercontent.com';
    let callback;
    const renderButton = vi.fn();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(options => {
            callback = options.callback;
          }),
          renderButton,
        },
      },
    };
    const onCredential = vi.fn();
    render(<GoogleButton onCredential={onCredential} />);

    await vi.waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(window.google.accounts.id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'client-123.apps.googleusercontent.com',
      }),
    );
    callback({ credential: 'id-token-abc' });
    expect(onCredential).toHaveBeenCalledWith('id-token-abc');
  });
});

describe('OtpPage guard', () => {
  it('sends a direct visit (no number in router state) back to the login page', async () => {
    const router = createMemoryRouter(
      [
        { path: '/login/otp', element: <OtpPage /> },
        { path: '/login', element: <p>login page</p> },
      ],
      { initialEntries: ['/login/otp'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
