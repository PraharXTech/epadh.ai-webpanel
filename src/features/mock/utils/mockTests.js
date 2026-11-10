export const CATEGORIES = [
  {
    id: 'all',
    label: 'All Tests',
    icon: 'file-text',
    color: '#2563eb',
    bg: 'bg-blue-100',
  },
  {
    id: 'full',
    label: 'Full Length',
    icon: 'clipboard-list',
    color: '#e11d48',
    bg: 'bg-rose-100',
  },
  {
    id: 'subject',
    label: 'Subject Wise',
    icon: 'book-open',
    color: '#7c3aed',
    bg: 'bg-violet-100',
  },
  {
    id: 'pyq',
    label: 'Previous Year',
    icon: 'repeat',
    color: '#ea580c',
    bg: 'bg-orange-100',
  },
  {
    id: 'topic',
    label: 'Topic Wise',
    icon: 'target',
    color: '#059669',
    bg: 'bg-emerald-100',
  },
];

export const TYPE_TAGS = {
  full: {
    label: 'Full Length',
    text: 'text-emerald-700',
    bg: 'bg-emerald-100',
  },
  subject: {
    label: 'Subject Wise',
    text: 'text-orange-700',
    bg: 'bg-orange-100',
  },
  pyq: { label: 'Previous Year', text: 'text-violet-700', bg: 'bg-violet-100' },
  topic: { label: 'Topic Wise', text: 'text-sky-700', bg: 'bg-sky-100' },
};

export const TYPE_ICONS = {
  full: { icon: 'file-text', color: '#2563eb', bg: 'bg-blue-50' },
  subject: { icon: 'book-open', color: '#16a34a', bg: 'bg-green-50' },
  pyq: { icon: 'repeat', color: '#e11d48', bg: 'bg-rose-50' },
  topic: { icon: 'target', color: '#7c3aed', bg: 'bg-violet-50' },
};

export const SORTS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'attempted', label: 'Attempted' },
  { id: 'difficulty', label: 'Difficulty' },
];

const sorters = {
  latest: (a, b) => b.order - a.order,
  popular: (a, b) => b.popularity - a.popularity,
  attempted: (a, b) =>
    (b.progress !== null) - (a.progress !== null) || b.order - a.order,
  difficulty: (a, b) => a.difficulty - b.difficulty,
};

export const countByCategory = (tests, id) =>
  id === 'all' ? tests.length : tests.filter(t => t.type === id).length;

// Tests of one category, in the chosen order.
export const visibleTests = (tests, category, sort) =>
  tests
    .filter(t => category === 'all' || t.type === category)
    .sort(sorters[sort]);
