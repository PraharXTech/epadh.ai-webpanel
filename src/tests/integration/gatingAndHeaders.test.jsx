import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import ScreenHeader from '@/components/common/ScreenHeader';
import SectionHeader from '@/components/common/SectionHeader';
import FeatureGate from '@/components/gating/FeatureGate';
import usePaywall from '@/hooks/usePaywall';

const PRO = { plan: 'pro', validTill: null, features: {} };
const FREE = { plan: 'free', features: { weakTopics: false } };

const mount = (ui, { entitlements = FREE, entries = ['/'], index } = {}) => {
  const store = configureStore({
    reducer: { user: (s = { entitlements }) => s },
  });
  const router = createMemoryRouter([{ path: '*', element: ui }], {
    initialEntries: entries,
    initialIndex: index,
  });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return router;
};

describe('FeatureGate', () => {
  const gate = (
    <FeatureGate feature="weakTopics" fallback={<p>locked</p>}>
      <p>unlocked</p>
    </FeatureGate>
  );
  it('shows the fallback to a Free student', () => {
    mount(gate, { entitlements: FREE });
    expect(screen.getByText('locked')).toBeInTheDocument();
  });
  it('shows the content to a Pro student', () => {
    mount(gate, { entitlements: PRO });
    expect(screen.getByText('unlocked')).toBeInTheDocument();
  });
  it('shows the content when the plan lists the feature', () => {
    mount(gate, {
      entitlements: { plan: 'free', features: { weakTopics: true } },
    });
    expect(screen.getByText('unlocked')).toBeInTheDocument();
  });
  it('treats an expired Pro plan as locked', () => {
    mount(gate, {
      entitlements: {
        plan: 'pro',
        validTill: '2020-01-01T00:00:00Z',
        features: {},
      },
    });
    expect(screen.getByText('locked')).toBeInTheDocument();
  });
});

describe('usePaywall', () => {
  function Probe() {
    const { canUse, openPaywall } = usePaywall();
    const location = useLocation();
    return (
      <>
        <p>weak:{String(canUse('weakTopics'))}</p>
        <button type="button" onClick={() => openPaywall('omr')}>
          upgrade
        </button>
        <p data-testid="url">{location.pathname + location.search}</p>
      </>
    );
  }

  it('canUse follows the entitlements', () => {
    mount(<Probe />, { entitlements: PRO });
    expect(screen.getByText('weak:true')).toBeInTheDocument();
  });

  it('openPaywall goes to Membership and says which feature was tried', async () => {
    mount(<Probe />);
    expect(screen.getByText('weak:false')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'upgrade' }));
    expect(screen.getByTestId('url')).toHaveTextContent(
      '/membership?feature=omr',
    );
  });
});

describe('ScreenHeader', () => {
  it('shows title and subtitle', () => {
    mount(<ScreenHeader title="Percentage" subtitle="Quantitative Aptitude" />);
    expect(
      screen.getByRole('heading', { name: 'Percentage' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Quantitative Aptitude')).toBeInTheDocument();
  });

  it('back goes one step in history', async () => {
    const router = mount(<ScreenHeader title="Topic" />, {
      entries: ['/a', '/b'],
      index: 1,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(router.state.location.pathname).toBe('/a');
  });

  it('back goes Home when the page was opened directly (no history)', async () => {
    const router = mount(<ScreenHeader title="Topic" />, {
      entries: ['/topics/t1'],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('a custom onBack wins', async () => {
    const onBack = vi.fn();
    mount(<ScreenHeader title="Topic" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('SectionHeader', () => {
  it('renders an action button', async () => {
    const onActionPress = vi.fn();
    mount(
      <SectionHeader
        title="Weak Topics"
        actionLabel="View all"
        onActionPress={onActionPress}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /View all/ }));
    expect(onActionPress).toHaveBeenCalled();
  });

  it('renders a link when given actionTo', () => {
    mount(
      <SectionHeader
        title="Exams"
        actionLabel="All exams"
        actionTo="/syllabus"
      />,
    );
    expect(screen.getByRole('link', { name: /All exams/ })).toHaveAttribute(
      'href',
      '/syllabus',
    );
  });

  it('has no action without a label', () => {
    mount(<SectionHeader title="Exams" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
