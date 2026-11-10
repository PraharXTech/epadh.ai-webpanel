import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import useGoBack from '@/hooks/useGoBack';

function Back({ fallback, override }) {
  const goBack = useGoBack(fallback);
  return (
    <button type="button" onClick={() => goBack(override)}>
      back
    </button>
  );
}

const mount = ({ entries, index, ...props }) => {
  const router = createMemoryRouter(
    [
      { path: '/page', element: <Back {...props} /> },
      { path: '*', element: <p>other</p> },
    ],
    { initialEntries: entries, initialIndex: index },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const browserIndex = idx =>
  vi
    .spyOn(window.history, 'state', 'get')
    .mockReturnValue(idx === undefined ? null : { idx });

afterEach(() => vi.restoreAllMocks());

describe('useGoBack', () => {
  describe('in the browser (history.state.idx)', () => {
    it('goes one step back when a page of the app is behind', async () => {
      browserIndex(2);
      const router = mount({
        entries: ['/a', '/b', '/page'],
        index: 2,
        fallback: '/home',
      });
      await userEvent.click(screen.getByRole('button', { name: 'back' }));
      expect(router.state.location.pathname).toBe('/b');
    });

    it('goes to the fallback when this is the first page, even after a replace', async () => {
      // the case the old "key === default" rule got wrong: the first page was replaced, so its
      // key is no longer "default", but there is still nothing behind it
      browserIndex(0);
      const router = mount({
        entries: ['/a', '/page'],
        index: 1,
        fallback: '/home',
      });
      expect(router.state.location.key).not.toBe('default');
      await userEvent.click(screen.getByRole('button', { name: 'back' }));
      expect(router.state.location.pathname).toBe('/home');
    });

    it('replaces the entry, so Back from the fallback does not return here', async () => {
      browserIndex(0);
      const router = mount({ entries: ['/page'], index: 0, fallback: '/home' });
      await userEvent.click(screen.getByRole('button', { name: 'back' }));
      expect(router.state.historyAction).toBe('REPLACE');
    });
  });

  describe('without a browser history (in-memory router)', () => {
    it('goes back when the page is not the first entry', async () => {
      browserIndex(undefined);
      const router = mount({
        entries: ['/a', '/page'],
        index: 1,
        fallback: '/home',
      });
      await userEvent.click(screen.getByRole('button', { name: 'back' }));
      expect(router.state.location.pathname).toBe('/a');
    });

    it('goes to the fallback on the first entry', async () => {
      browserIndex(undefined);
      const router = mount({ entries: ['/page'], index: 0, fallback: '/home' });
      await userEvent.click(screen.getByRole('button', { name: 'back' }));
      expect(router.state.location.pathname).toBe('/home');
    });
  });

  it('uses a fallback given at click time instead of the default one', async () => {
    browserIndex(0);
    const router = mount({
      entries: ['/page'],
      index: 0,
      fallback: '/home',
      override: '/topics/t1',
    });
    await userEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(router.state.location.pathname).toBe('/topics/t1');
  });
});
