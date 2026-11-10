import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BarChart from '@/components/charts/BarChart';
import Ring from '@/components/charts/Ring';
import ProgressBar from '@/components/common/ProgressBar';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import TextField from '@/components/forms/TextField';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Modal from '@/components/ui/Modal';
import Tabs, { TabPanel } from '@/components/ui/Tabs';

describe('Button', () => {
  it('is a plain button by default and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('loading disables it, marks it busy and blocks a double tap', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Pay
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Pay' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('is a toggle that reports its state', () => {
    const { rerender } = render(<Chip>SSC</Chip>);
    expect(screen.getByRole('button', { name: 'SSC' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    rerender(<Chip selected>SSC</Chip>);
    expect(screen.getByRole('button', { name: 'SSC' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('Avatar', () => {
  it('shows the first letter, or a photo when there is one', () => {
    const { rerender } = render(<Avatar name="asha verma" />);
    expect(screen.getByRole('img', { name: 'asha verma' })).toHaveTextContent(
      'A',
    );
    rerender(<Avatar name="Asha" src="/me.png" />);
    expect(screen.getByRole('img', { name: "Asha's photo" })).toHaveAttribute(
      'src',
      '/me.png',
    );
  });
});

describe('Tabs', () => {
  const items = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma', count: 3 },
  ];
  function Harness() {
    const [value, setValue] = useState('a');
    return (
      <>
        <Tabs id="t" items={items} value={value} onChange={setValue} />
        <TabPanel tabsId="t" id="a" value={value}>
          panel a
        </TabPanel>
        <TabPanel tabsId="t" id="b" value={value}>
          panel b
        </TabPanel>
      </>
    );
  }

  it('selects with the arrow keys, wraps, and supports Home / End', async () => {
    render(<Harness />);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    alpha.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /Gamma/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Gamma/ })).toHaveFocus();
  });

  it('only the selected tab is in the tab order, and shows counts', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByRole('tab', { name: /Gamma/ })).toHaveTextContent('3');
  });

  it('links each tab to its panel with ARIA ids', () => {
    render(<Harness />);
    const tab = screen.getByRole('tab', { name: 'Alpha' });
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      tab.getAttribute('aria-controls'),
    );
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      tab.id,
    );
  });
});

describe('TextField', () => {
  it('ties the label to the input', async () => {
    render(<TextField label="Mobile number" />);
    await userEvent.type(screen.getByLabelText('Mobile number'), '98765');
    expect(screen.getByLabelText('Mobile number')).toHaveValue('98765');
  });

  it('exposes the error to assistive tech', () => {
    render(<TextField label="Mobile" error="Enter 10 digits" />);
    const input = screen.getByLabelText('Mobile');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter 10 digits');
  });

  it('toggles password visibility', async () => {
    render(<TextField label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' }),
    );
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(
      screen.getByRole('button', { name: 'Hide password' }),
    );
    expect(input).toHaveAttribute('type', 'password');
  });

  it('keeps a hidden label available to screen readers', () => {
    render(<TextField label="Search" hideLabel />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });
});

describe('ProgressBar and charts', () => {
  it('ProgressBar clamps to 0-100', () => {
    const { rerender } = render(<ProgressBar percent={140} label="Done" />);
    expect(screen.getByRole('progressbar', { name: 'Done' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    rerender(<ProgressBar percent={-5} label="Done" />);
    expect(screen.getByRole('progressbar', { name: 'Done' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('Ring reports its value', () => {
    render(
      <Ring percent={72.4} label="Goal">
        72%
      </Ring>,
    );
    expect(screen.getByRole('progressbar', { name: 'Goal' })).toHaveAttribute(
      'aria-valuenow',
      '72',
    );
  });

  it('BarChart describes itself and scales bars to the largest value', () => {
    const { container } = render(
      <BarChart
        label="Study time"
        unit="min"
        data={[
          { label: 'Mon', value: 30 },
          { label: 'Tue', value: 60 },
          { label: 'Wed', value: 0 },
        ]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Study time: Mon 30 min, Tue 60 min, Wed 0 min',
    );
    const heights = [...container.querySelectorAll('[data-bar]')].map(
      bar => bar.style.height,
    );
    expect(heights).toEqual(['50%', '100%', '0%']);
  });
});

describe('EmptyState and ErrorState', () => {
  it('EmptyState shows its action', () => {
    render(
      <EmptyState title="No tests yet" message="Finish one first.">
        <button type="button">Start</button>
      </EmptyState>,
    );
    expect(screen.getByText('No tests yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('ErrorState is an alert with a working retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="No internet." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No internet.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Modal', () => {
  function Harness({ dismissible = true }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          opener
        </button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Pick"
          dismissible={dismissible}>
          <button type="button">first</button>
          <button type="button">last</button>
        </Modal>
      </>
    );
  }

  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens named, focuses inside, and locks page scroll', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'opener' }));
    expect(screen.getByRole('dialog', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('keeps Tab inside the dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'opener' }));
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('closes on Escape, restores focus and unlocks scroll', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'opener' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on a backdrop click', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'opener' }));
    await userEvent.click(
      document.querySelector('[aria-hidden="true"].absolute'),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores Escape and the backdrop when not dismissible', async () => {
    render(<Harness dismissible={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'opener' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      document.querySelector('[aria-hidden="true"].absolute'),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  const buttons = [
    { text: 'Stay', style: 'cancel' },
    { text: 'Leave', style: 'destructive' },
  ];

  it('shows title, message and buttons and reports the pressed one', async () => {
    const onButtonPress = vi.fn();
    render(
      <ConfirmDialog
        title="Leave this test?"
        message="Your answers are saved."
        buttons={buttons}
        onButtonPress={onButtonPress}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: 'Leave this test?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Your answers are saved.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onButtonPress).toHaveBeenCalledWith(buttons[1]);
  });

  it('Escape presses the cancel button', async () => {
    const onButtonPress = vi.fn();
    render(
      <ConfirmDialog
        title="Sure?"
        buttons={buttons}
        onButtonPress={onButtonPress}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onButtonPress).toHaveBeenCalledWith(buttons[0]);
  });

  it('must be answered when there is no cancel button', async () => {
    const onButtonPress = vi.fn();
    render(
      <ConfirmDialog
        title="Heads up"
        buttons={[{ text: 'OK' }]}
        onButtonPress={onButtonPress}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onButtonPress).not.toHaveBeenCalled();
  });

  it('does not autofocus a destructive button', () => {
    render(
      <ConfirmDialog
        title="Sure?"
        buttons={buttons}
        onButtonPress={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus();
  });
});
