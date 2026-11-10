import { useState } from 'react';
import toast from 'react-hot-toast';
import AppIcon from '@/components/common/AppIcon';
import BrandLogo from '@/components/common/BrandLogo';
import NoticeBanner from '@/components/common/NoticeBanner';
import ProgressBar from '@/components/common/ProgressBar';
import SectionHeader from '@/components/common/SectionHeader';
import BarChart from '@/components/charts/BarChart';
import Ring from '@/components/charts/Ring';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import Skeleton from '@/components/feedback/Skeleton';
import TextField from '@/components/forms/TextField';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Modal from '@/components/ui/Modal';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { showAlert } from '@/services/alerts/alertStore';

// Dev-only gallery of every shared component (route /dev/ui, not in production builds).
// Resize the window to 360 / 768 / 1280 px and tab through it to check the W2 "done when".
function Block({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UiGalleryPage() {
  const [chip, setChip] = useState('all');
  const [tab, setTab] = useState('material');
  const [pillTab, setPillTab] = useState('practice');
  const [modal, setModal] = useState(null);
  const [name, setName] = useState('');

  return (
    <div className="mx-auto max-w-3xl p-4 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <BrandLogo size={30} />
        <span className="text-sm text-slate-500">UI gallery (dev only)</span>
      </div>

      <Block title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button icon="plus">With icon</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
        <Button fullWidth className="mt-3">
          Full width
        </Button>
      </Block>

      <Block title="Chips, badges, avatars">
        <div className="mb-4 flex flex-wrap gap-2">
          {['all', 'ssc', 'upsssc', 'police'].map(id => (
            <Chip key={id} selected={chip === id} onClick={() => setChip(id)}>
              {id.toUpperCase()}
            </Chip>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="blue">Free</Badge>
          <Badge tone="amber">Pro</Badge>
          <Badge tone="violet">AI</Badge>
          <Badge tone="green">Viewed</Badge>
          <Badge tone="red">Locked</Badge>
          <Badge>Draft</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name="Asha Verma" />
          <Avatar name="Ravi" size={56} />
          <Avatar />
        </div>
      </Block>

      <Block title="Form field">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Mobile number"
            icon="smartphone"
            inputMode="numeric"
            placeholder="98765 43210"
            value={name}
            onChange={event => setName(event.target.value)}
          />
          <TextField
            label="With a prefix"
            prefix={<span className="text-sm text-slate-700">+91</span>}
            placeholder="Mobile"
          />
          <TextField
            label="Password"
            type="password"
            icon="lock"
            defaultValue="secret"
          />
          <TextField
            label="With an error"
            error="Enter a valid 10-digit number"
            defaultValue="123"
          />
        </div>
      </Block>

      <Block title="Cards, section header, progress">
        <SectionHeader
          title="Preparation progress"
          actionLabel="View all"
          onActionPress={() => toast('View all pressed')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Syllabus completed
            </p>
            <ProgressBar percent={64} label="Syllabus completed" />
            <p className="mt-1 text-xs text-slate-500">64%</p>
          </Card>
          <Card className="flex items-center gap-4">
            <Ring percent={72} label="Daily goal">
              <span className="text-lg font-extrabold">72%</span>
            </Ring>
            <div>
              <p className="font-semibold text-slate-900">Daily goal</p>
              <p className="text-sm text-slate-500">43 of 60 min</p>
            </div>
          </Card>
        </div>
      </Block>

      <Block title="Tabs">
        <Tabs
          id="gallery-underline"
          label="Topic sections"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'material', label: 'Study Material' },
            { id: 'practice', label: 'Practice Test' },
            { id: 'ask', label: 'Ask' },
          ]}
        />
        <TabPanel
          tabsId="gallery-underline"
          id={tab}
          value={tab}
          className="py-3 text-sm text-slate-600">
          Panel for “{tab}”. Try the arrow keys, Home and End.
        </TabPanel>
        <Tabs
          id="gallery-pill"
          label="History"
          variant="pill"
          className="mt-4"
          value={pillTab}
          onChange={setPillTab}
          items={[
            { id: 'practice', label: 'MCQ Practice', count: 12 },
            { id: 'mock', label: 'Mock Tests', count: 3 },
            { id: 'omr', label: 'OMR' },
          ]}
        />
      </Block>

      <Block title="Charts">
        <Card>
          <BarChart
            label="Study time this week"
            unit="min"
            data={[
              { label: 'Mon', value: 25 },
              { label: 'Tue', value: 40 },
              { label: 'Wed', value: 0 },
              { label: 'Thu', value: 60 },
              { label: 'Fri', value: 35 },
              { label: 'Sat', value: 20 },
              { label: 'Sun', value: 50 },
            ]}
          />
        </Card>
      </Block>

      <Block title="States">
        <NoticeBanner
          message="Couldn't refresh. Showing saved data."
          actionLabel="Retry"
          onAction={() => toast('Retry pressed')}
        />
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Card padded={false}>
            <EmptyState
              icon="clipboard-list"
              title="No tests yet"
              message="Finish a practice test and it will show up here.">
              <Button size="sm">Start practising</Button>
            </EmptyState>
          </Card>
          <Card padded={false}>
            <ErrorState
              message="No internet connection. Please check your network."
              onRetry={() => toast('Retrying…')}
            />
          </Card>
        </div>
        <div className="mt-4 grid gap-2" aria-busy="true">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Block>

      <Block title="Dialogs, sheets and toasts">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setModal('center')}>
            Modal
          </Button>
          <Button variant="outline" onClick={() => setModal('bottom')}>
            Bottom sheet
          </Button>
          <Button variant="outline" onClick={() => setModal('right')}>
            Side drawer
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              showAlert('Leave this test?', 'Your answers are saved.', [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: () => toast.success('Left the test'),
                },
              ])
            }>
            Confirm dialog
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              showAlert('Payment successful', 'Pro is now active.', null, {
                tone: 'success',
              })
            }>
            Toast (success)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              showAlert("You're offline", 'AI needs internet.', null, {
                tone: 'warning',
              })
            }>
            Toast (warning)
          </Button>
        </div>
      </Block>

      <Block title="Icons">
        <div className="flex flex-wrap gap-4 text-slate-700">
          {['home', 'bell', 'trophy', 'scan', 'mic', 'crown', 'flame'].map(
            icon => (
              <span key={icon} className="flex flex-col items-center gap-1">
                <AppIcon name={icon} size={24} color="currentColor" />
                <span className="text-[11px] text-slate-500">{icon}</span>
              </span>
            ),
          )}
        </div>
      </Block>

      {['center', 'bottom', 'right'].map(placement => (
        <Modal
          key={placement}
          open={modal === placement}
          onClose={() => setModal(null)}
          title={`${placement} modal`}
          placement={placement}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {placement === 'bottom' ? 'Choose a subject' : 'A modal'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Focus stays inside, Escape closes it and focus returns to the
              button that opened it.
            </p>
            <TextField
              className="mt-4"
              label="Search"
              icon="search"
              data-autofocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Close
              </Button>
              <Button onClick={() => setModal(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      ))}
    </div>
  );
}
