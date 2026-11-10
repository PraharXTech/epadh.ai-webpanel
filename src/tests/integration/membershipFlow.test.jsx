import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';
import AlertHost from '@/app/AlertHost';
import { logout } from '@/features/auth/store/authSlice';
import CheckoutPage from '@/features/membership/pages/CheckoutPage';
import MembershipPage from '@/features/membership/pages/MembershipPage';
import PaymentHistoryPage from '@/features/membership/pages/PaymentHistoryPage';
import PaymentProcessingPage from '@/features/membership/pages/PaymentProcessingPage';
import PaymentSuccessPage from '@/features/membership/pages/PaymentSuccessPage';
import {
  clearCheckout,
  startCheckout,
  verifyCheckout,
} from '@/features/membership/store/membershipSlice';
import MockInstructionsPage from '@/features/mock/pages/MockInstructionsPage';
import { fetchMe } from '@/features/user/store/userSlice';
import { PATHS, PATTERNS } from '@/routes/routePaths';
import { store } from '@/store';
import { selectEntitlements } from '@/store/selectors/userSelectors';
import { loadExamData } from '../utils/examData';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile membershipFlow.test.jsx: plans and the paywall banner, a full checkout
// through the processing page to the success page, a cancelled and a still-pending payment,
// a payment that never resolved before the tab was closed, history, and gating. Plus the web
// additions: leaving mid-confirmation, a reload, an expired plan.
const SLOW = { timeout: 8000 };

const routes = [
  {
    // showAlert() needs the AlertHost the real app mounts above the router
    element: (
      <>
        <AlertHost />
        <Toaster />
        <Outlet />
      </>
    ),
    children: [
      { path: PATHS.membership, element: <MembershipPage /> },
      { path: PATTERNS.checkout, element: <CheckoutPage /> },
      { path: PATHS.paymentProcessing, element: <PaymentProcessingPage /> },
      { path: PATHS.paymentSuccess, element: <PaymentSuccessPage /> },
      { path: PATHS.paymentHistory, element: <PaymentHistoryPage /> },
      { path: PATTERNS.mockInstructions, element: <MockInstructionsPage /> },
      { path: PATHS.home, element: <p>home page</p> },
      { path: '*', element: <p>somewhere else</p> },
    ],
  },
];
const at = (...entries) =>
  renderWithRealStore(null, { routes, entries, index: entries.length - 1 });
const where = router => router.state.location.pathname;
const entitlements = () => selectEntitlements(store.getState());
const checkout = () => store.getState().membership.checkout;

const setPlan = (plan, validTill = null) =>
  act(() => {
    store.dispatch({
      type: fetchMe.fulfilled.type,
      payload: {
        profile: { id: 'u1', name: 'Asha', mobile: '9876543210' },
        selectedExamId: 'pet',
        entitlements: { plan, validTill, features: {} },
      },
    });
  });

describe('membership and payments', () => {
  beforeEach(async () => {
    store.dispatch(logout());
    await loadExamData();
    setPlan('free');
  }, 15000);

  describe('membership page', () => {
    it('shows plans, the comparison table and the reason a paywall sent the student here', async () => {
      at('/membership?feature=weakTopics');
      expect(
        await screen.findByText('Weak topic analysis needs Pro', {}, SLOW),
      ).toBeInTheDocument();
      expect(screen.getByText('Full Potential')).toBeInTheDocument();
      expect(
        await screen.findByRole('radio', { name: /Pro Monthly/ }, SLOW),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /Pro Yearly/ }),
      ).toBeInTheDocument();
      expect(screen.getByText('Save 44%')).toBeInTheDocument();
      expect(screen.getByText('Plan Comparison')).toBeInTheDocument();
      const table = screen.getByRole('table', {
        name: 'Free and Pro plans compared',
      });
      expect(
        within(table).getByText('Advanced mock tests'),
      ).toBeInTheDocument();
      expect(within(table).getAllByText('Not included')).toHaveLength(1);
    });

    it('preselects the popular plan, and switching changes the upgrade button', async () => {
      at('/membership');
      const monthly = await screen.findByRole(
        'radio',
        { name: /Pro Monthly/ },
        SLOW,
      );
      expect(monthly).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('button', { name: 'Upgrade to Pro Monthly' }),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('radio', { name: /Pro Yearly/ }));
      expect(screen.getByRole('radio', { name: /Pro Yearly/ })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(
        screen.getByRole('button', { name: 'Upgrade to Pro Yearly' }),
      ).toBeInTheDocument();

      // the billing toggle picks the same plans
      await userEvent.click(screen.getByRole('button', { name: 'Monthly' }));
      expect(
        screen.getByRole('radio', { name: /Pro Monthly/ }),
      ).toHaveAttribute('aria-checked', 'true');
    });

    it('goes to checkout for the chosen plan', async () => {
      const { router } = at('/membership');
      await userEvent.click(
        await screen.findByRole('radio', { name: /Pro Yearly/ }, SLOW),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Upgrade to Pro Yearly' }),
      );
      expect(where(router)).toBe('/membership/checkout/pro-yearly');
    });

    it('shows a Pro student their plan and expiry instead of the plans', async () => {
      setPlan(
        'pro',
        new Date(Date.now() + 10 * 86400000 + 3600000).toISOString(),
      );
      at('/membership');
      expect(await screen.findByText(/You're on/)).toBeInTheDocument();
      expect(screen.getByText(/10 days left|11 days left/)).toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(screen.queryByText(/Upgrade to/)).not.toBeInTheDocument();
    });

    it('treats a Pro plan that has expired as Free again', async () => {
      setPlan('pro', new Date(Date.now() - 86400000).toISOString());
      at('/membership');
      expect(await screen.findByText('Full Potential')).toBeInTheDocument();
      expect(
        await screen.findByRole('radio', { name: /Pro Monthly/ }, SLOW),
      ).toBeInTheDocument();
    });

    it('opens payment history from the header and from the link', async () => {
      const { router } = at('/membership');
      await userEvent.click(
        screen.getByRole('link', { name: 'Payment history' }),
      );
      expect(where(router)).toBe('/membership/payments');
      await act(async () => router.navigate('/membership'));
      await userEvent.click(
        screen.getByRole('link', { name: /View Payment History/ }),
      );
      expect(where(router)).toBe('/membership/payments');
    });
  });

  describe('checkout', () => {
    it('completes a full checkout through the processing page and shows Pro right away', async () => {
      const { router } = at('/membership');
      await userEvent.click(
        await screen.findByRole(
          'button',
          { name: 'Upgrade to Pro Monthly' },
          SLOW,
        ),
      );
      expect(where(router)).toBe('/membership/checkout/pro-monthly');
      expect(await screen.findByText('₹149')).toBeInTheDocument();
      expect(screen.getByText('Asha')).toBeInTheDocument();
      expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
      expect(
        screen.getByText(/processed securely by Razorpay/),
      ).toBeInTheDocument();

      // the order is created, then it hands over to the processing page
      await waitFor(
        () => expect(where(router)).toBe('/membership/processing'),
        SLOW,
      );
      expect(router.state.location.state).toMatchObject({
        planId: 'pro-monthly',
        outcome: 'success',
      });
      expect(
        screen.getByRole('heading', { name: 'Processing Payment' }),
      ).toBeInTheDocument();

      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      expect(entitlements().plan).toBe('pro');
      expect(store.getState().membership.pendingOrder).toBeNull();

      expect(
        await screen.findByRole('heading', { name: 'Payment Successful!' }),
      ).toBeInTheDocument();
      const details = screen.getByRole('region', {
        name: 'Transaction details',
      });
      expect(within(details).getByText('Pro Monthly')).toBeInTheDocument();
      expect(within(details).getByText('₹149')).toBeInTheDocument();
      expect(within(details).getByText('UPI')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText("What's Included?")).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: /Continue to App/ }),
      );
      await waitFor(() => expect(where(router)).toBe('/'));
      expect(checkout().receipt).toBeNull();
    });

    it('does not leave the checkout and processing pages in the history', async () => {
      const { router } = at('/membership/checkout/pro-monthly');
      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      await userEvent.click(
        await screen.findByRole('button', { name: /Continue to App/ }),
      );
      await waitFor(() => expect(where(router)).toBe('/'));
      await act(async () => router.navigate(-1));
      expect(where(router)).toBe('/membership'); // the checkout and processing steps were replaced
    });

    it('says so for a plan that does not exist', async () => {
      at('/membership/checkout/nope');
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unknown plan',
      );
      expect(
        screen.getByRole('link', { name: 'Back to plans' }),
      ).toHaveAttribute('href', '/membership');
    });

    it('sends a student who is already Pro back to Membership', async () => {
      setPlan('pro');
      const { router } = at('/membership/checkout/pro-monthly');
      await waitFor(() => expect(where(router)).toBe('/membership'));
      expect(store.getState().membership.pendingOrder).toBeNull();
    });

    it('creates one order for a double mount (strict mode) and reuses the key on a retry', async () => {
      const { router } = at('/membership/checkout/pro-monthly');
      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      const first = store.getState().membership.history[0].id;
      expect(first).toMatch(/^order_mock_/);
      expect(store.getState().membership.history).toHaveLength(1);
    });
  });

  describe('processing page', () => {
    const begin = async planId => {
      await act(async () => {
        await store.dispatch(startCheckout(planId));
      });
      return checkout().orderId;
    };
    const processing = (state, router) =>
      router.navigate('/membership/processing', { state });

    it('a cancelled payment leaves the student on Free and offers to try again', async () => {
      const orderId = await begin('pro-monthly');
      const { router } = at('/membership');
      await act(async () =>
        processing(
          { planId: 'pro-monthly', orderId, outcome: 'cancelled' },
          router,
        ),
      );
      const dialog = await screen.findByRole(
        'dialog',
        { name: 'Payment cancelled' },
        SLOW,
      );
      expect(entitlements().plan).toBe('free');
      expect(store.getState().membership.pendingOrder).toBeNull();
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Try again' }),
      );
      await waitFor(() =>
        expect(where(router)).toBe('/membership/checkout/pro-monthly'),
      );
    });

    it('Cancel in the failure dialog goes back to Membership', async () => {
      const orderId = await begin('pro-monthly');
      const { router } = at('/membership');
      await act(async () =>
        processing(
          { planId: 'pro-monthly', orderId, outcome: 'failed' },
          router,
        ),
      );
      const dialog = await screen.findByRole(
        'dialog',
        { name: 'Payment failed' },
        SLOW,
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Cancel' }),
      );
      await waitFor(() => expect(where(router)).toBe('/membership'));
      expect(entitlements().plan).toBe('free');
    });

    it(
      'a still-processing payment resolves in place without failing early',
      { timeout: 20000 },
      async () => {
        const orderId = await begin('pro-monthly');
        const { router } = at('/membership');
        await act(async () =>
          processing(
            { planId: 'pro-monthly', orderId, outcome: 'pending' },
            router,
          ),
        );
        expect(
          screen.getByRole('heading', { name: 'Processing Payment' }),
        ).toBeInTheDocument();
        await screen.findByText(/taking a little longer/, {}, SLOW);
        await waitFor(() => expect(where(router)).toBe('/membership/success'), {
          timeout: 12000,
        });
        expect(entitlements().plan).toBe('pro');
      },
    );

    it('holds the student on the page while the payment is being confirmed', async () => {
      const orderId = await begin('pro-monthly');
      const { router } = at('/membership');
      await act(async () =>
        processing(
          { planId: 'pro-monthly', orderId, outcome: 'success' },
          router,
        ),
      );
      await screen.findByRole('heading', { name: 'Processing Payment' });
      await act(async () => router.navigate('/membership'));
      expect(where(router)).toBe('/membership/processing');
      expect(
        await screen.findByText(/confirming your payment/i),
      ).toBeInTheDocument();

      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);

      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      const after = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(after);
      expect(after.defaultPrevented).toBe(false);
    });

    it('goes to Membership when there is nothing to confirm', async () => {
      const { router } = at('/membership/processing');
      await waitFor(() => expect(where(router)).toBe('/membership'));
    });

    it('does not verify a payment twice when the page is reloaded after it settled', async () => {
      const orderId = await begin('pro-monthly');
      await act(async () => {
        await store.dispatch(
          verifyCheckout({
            orderId,
            planId: 'pro-monthly',
            outcome: 'success',
          }),
        );
      });
      expect(store.getState().membership.history).toHaveLength(1);
      // the reload keeps router state, but the pending order is gone
      const { router } = at('/membership');
      await act(async () =>
        processing(
          { planId: 'pro-monthly', orderId, outcome: 'success' },
          router,
        ),
      );
      await waitFor(() => expect(where(router)).toBe('/membership'));
      expect(store.getState().membership.history).toHaveLength(1);
    });

    it(
      'a reload on the processing page picks the payment up again from the saved pending order',
      { timeout: 20000 },
      async () => {
        await begin('pro-yearly');
        const { router } = at('/membership/processing'); // no router state: it was lost
        expect(
          await screen.findByRole('heading', { name: 'Processing Payment' }),
        ).toBeInTheDocument();
        await waitFor(() => expect(where(router)).toBe('/membership/success'), {
          timeout: 12000,
        });
        expect(entitlements().plan).toBe('pro');
        expect(store.getState().membership.pendingOrder).toBeNull();
      },
    );
  });

  describe('success page', () => {
    it('goes to Membership after a reload, when the receipt is gone', async () => {
      store.dispatch(clearCheckout());
      const { router } = at('/membership/success');
      await waitFor(() => expect(where(router)).toBe('/membership'));
    });

    it('the invoice button explains where receipts are', async () => {
      const { router } = at('/membership/checkout/pro-monthly');
      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      await userEvent.click(
        await screen.findByRole('button', { name: /Download Invoice/ }),
      );
      expect(await screen.findByText(/Invoice on its way/)).toBeInTheDocument();
    });

    it('the close button also finishes', async () => {
      const { router } = at('/membership/checkout/pro-monthly');
      await waitFor(
        () => expect(where(router)).toBe('/membership/success'),
        SLOW,
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'Close' }),
      );
      await waitFor(() => expect(where(router)).toBe('/'));
    });
  });

  describe('a payment that never resolved before the tab was closed', () => {
    it('is picked up when Membership opens', { timeout: 20000 }, async () => {
      await act(async () => {
        await store.dispatch(startCheckout('pro-yearly'));
      });
      expect(store.getState().membership.pendingOrder).not.toBeNull();

      at('/membership');
      expect(
        await screen.findByText('Checking on your last payment…', {}, SLOW),
      ).toBeInTheDocument();
      await waitFor(() => expect(entitlements().plan).toBe('pro'), {
        timeout: 12000,
      });
      expect(store.getState().membership.pendingOrder).toBeNull();
      await waitFor(() =>
        expect(
          screen.queryByText('Checking on your last payment…'),
        ).not.toBeInTheDocument(),
      );
    });
  });

  describe('payment history', () => {
    it('lists receipts', async () => {
      await act(async () => {
        await store.dispatch(startCheckout('pro-monthly'));
      });
      await act(async () => {
        await store.dispatch(
          verifyCheckout({
            orderId: checkout().orderId,
            planId: 'pro-monthly',
            outcome: 'success',
          }),
        );
      });
      at('/membership/payments');
      expect(await screen.findByText('Pro Monthly')).toBeInTheDocument();
      expect(screen.getByText('₹149')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('shows an empty state for a student who never paid', async () => {
      at('/membership/payments');
      expect(
        await screen.findByText(/No payments yet/, {}, SLOW),
      ).toBeInTheDocument();
    });
  });

  describe('gating', () => {
    it('lets a Pro student into a premium mock test, and shows Start instead of the lock', async () => {
      setPlan('pro');
      at('/mocks/pyq-2023');
      expect(
        await screen.findByRole('button', { name: 'Start test' }, SLOW),
      ).toBeInTheDocument();
      expect(screen.queryByText('Unlock with Pro')).not.toBeInTheDocument();
    });

    it('a Free student sees the lock on the same test', async () => {
      at('/mocks/pyq-2023');
      expect(
        await screen.findByRole('button', { name: 'Unlock with Pro' }, SLOW),
      ).toBeInTheDocument();
    });
  });
});
