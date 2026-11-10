import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamSelectionPage from '@/features/exams/pages/ExamSelectionPage';
import { logout } from '@/features/auth/store/authSlice';
import { store } from '@/store';
import { chooseExam } from '@/features/user/store/userSlice';
import { selectSelectedExamIds } from '@/store/selectors/userSelectors';
import { renderWithRealStore } from '../utils/renderWithRealStore';

// Web port of mobile examSelectionMulti.test.jsx (the first-run test lives in authFlow).
const SLOW = { timeout: 4000 };

const renderPage = (props, options) =>
  renderWithRealStore(<ExamSelectionPage {...props} />, options);

const exam = name =>
  screen.findByRole('checkbox', { name: new RegExp(name) }, SLOW);

describe('exam selection: several exams', () => {
  beforeEach(() => {
    store.dispatch(logout());
  });

  it('needs at least one exam, then counts what is picked', async () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Choose your exams' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Select at least one exam' }),
    ).toBeDisabled();

    await userEvent.click(await exam('UPSSSC PET'));
    expect(
      screen.getByRole('button', { name: 'Continue (1 selected)' }),
    ).toBeEnabled();
    await userEvent.click(await exam('SSC GD'));
    expect(
      screen.getByRole('button', { name: 'Continue (2 selected)' }),
    ).toBeInTheDocument();

    await userEvent.click(await exam('UPSSSC PET')); // tap again to drop it
    expect(
      screen.getByRole('button', { name: 'Continue (1 selected)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /UPSSSC PET/ }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('has no "Others" / custom exam option: exams come from the admin list', async () => {
    renderPage();
    await exam('UPSSSC PET');
    expect(screen.queryByText(/Others/)).not.toBeInTheDocument();
    expect(screen.queryByText(/My exam is not listed/)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Enter your exam name'),
    ).not.toBeInTheDocument();
  });

  it('filters the list as you search, and says when nothing matches', async () => {
    renderPage();
    await exam('UPSSSC PET');
    await userEvent.type(screen.getByLabelText('Search exams'), 'police');
    expect(
      screen.getByRole('checkbox', { name: /UP Police/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: /SSC GD/ }),
    ).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Search exams'));
    await userEvent.type(screen.getByLabelText('Search exams'), 'zzz');
    expect(screen.getByText(/No exams match "zzz"/)).toBeInTheDocument();
  });

  it('saves every picked exam in the order they were tapped', async () => {
    renderPage();
    await userEvent.click(await exam('SSC GD'));
    await userEvent.click(await exam('UPSSSC PET'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Continue (2 selected)' }),
    );
    await waitFor(
      () =>
        expect(selectSelectedExamIds(store.getState())).toEqual(['gd', 'pet']),
      SLOW,
    );
  });

  it('starts from the current exams when managing them, and goes back after saving', async () => {
    // the student already has PET; the page must start from it
    await store.dispatch(chooseExam({ examIds: ['pet'] }));
    const second = renderPage(
      { changing: true },
      { entries: ['/', '/exams/select'], index: 1 },
    );
    expect(
      await screen.findByRole('heading', { name: 'Your exams' }, SLOW),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save (1 selected)' }),
    ).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('checkbox', { name: /SSC CHSL/ }, SLOW),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Save (2 selected)' }),
    );
    await waitFor(
      () =>
        expect(selectSelectedExamIds(store.getState())).toEqual([
          'pet',
          'chsl',
        ]),
      SLOW,
    );
    await waitFor(
      () => expect(second.router.state.location.pathname).toBe('/'),
      SLOW,
    );
  }, 15000);

  it('the first-run page offers a way to log out; the "change" page offers back instead', async () => {
    const first = renderPage();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
    first.unmount();

    renderPage({ changing: true });
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log out' }),
    ).not.toBeInTheDocument();
  });
});
