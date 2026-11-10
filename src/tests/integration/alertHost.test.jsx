import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import AlertHost from '@/app/AlertHost';
import { showAlert } from '@/services/alerts/alertStore';

// Web port of mobile customAlert.test.jsx. Behaviour change on purpose: a plain notice
// (one OK button, nothing to run) is a toast, not a dialog; only real choices are dialogs.
const setup = () =>
  render(
    <>
      <AlertHost />
      <Toaster />
    </>,
  );

describe('alert host', () => {
  it('renders nothing until showAlert is called', () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a plain notice as a toast, with no dialog', async () => {
    setup();
    act(() => showAlert('Time is up', 'Your test has been submitted.'));
    expect(
      await screen.findByText('Time is up. Your test has been submitted.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("calls the pressed button's onPress and dismisses", async () => {
    setup();
    const onLeave = vi.fn();
    act(() =>
      showAlert('Leave this test?', 'Your answers are saved.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onLeave },
      ]),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Leave this test?' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismissing with the cancel button runs no destructive action', async () => {
    setup();
    const onLeave = vi.fn();
    act(() =>
      showAlert('Leave?', 'x', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onLeave },
      ]),
    );
    await userEvent.keyboard('{Escape}');
    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('replaces one dialog with the next when shown back to back', async () => {
    setup();
    const choice = [
      { text: 'Yes', onPress: () => {} },
      { text: 'No', style: 'cancel' },
    ];
    act(() => showAlert('First', 'one', choice));
    expect(
      await screen.findByRole('dialog', { name: 'First' }),
    ).toBeInTheDocument();
    act(() => showAlert('Second', 'two', choice));
    expect(
      await screen.findByRole('dialog', { name: 'Second' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'First' }),
    ).not.toBeInTheDocument();
  });
});
