// Builds the unified "Tests" hub list out of two real sources: the syllabus tree
// (topic-wise practice, our own engine) and the mock test bank (full / PYQ / subject
// papers, src/features/mock). Nothing here invents scores or content; a "Chapter Test"
// is a real shortcut into that chapter's first topic (documented below), not a separate
// question bank, since the practice engine does not have chapter-scoped questions yet.
const DIFFICULTY_LABEL = {
  1: 'Basic to Moderate',
  2: 'Moderate',
  3: 'Advanced',
};

export const KIND_META = {
  mock: {
    label: 'Mock Test',
    icon: 'file-text',
    color: '#2563eb',
    bg: 'bg-blue-50',
    tagBg: 'bg-blue-100',
    tagText: 'text-blue-700',
    cta: 'button',
  },
  subject: {
    label: 'Subject Test',
    icon: 'book-open',
    color: '#16a34a',
    bg: 'bg-green-50',
    tagBg: 'bg-green-100',
    tagText: 'text-green-700',
    cta: 'button',
  },
  practice: {
    label: 'Practice Test',
    icon: 'target',
    color: '#7c3aed',
    bg: 'bg-violet-50',
    tagBg: 'bg-violet-100',
    tagText: 'text-violet-700',
    cta: 'button',
  },
  chapter: {
    label: 'Chapter Test',
    icon: 'clipboard-list',
    color: '#ea580c',
    bg: 'bg-orange-50',
    tagBg: 'bg-emerald-100',
    tagText: 'text-emerald-700',
    cta: 'badge',
  },
};

export const CATEGORIES = [
  { id: 'all', label: 'All Tests' },
  { id: 'mock', label: 'Mock Tests' },
  { id: 'practice', label: 'Practice Tests' },
  { id: 'chapter', label: 'Chapter Tests' },
  { id: 'subject', label: 'Subject Tests' },
];

export const SORTS = [
  { id: 'default', label: 'Recommended' },
  { id: 'az', label: 'A–Z' },
  { id: 'questions', label: 'Most Questions' },
];

// Default question count offered when a practice/chapter row is opened (the student
// still picks the exact count and mode on the setup screen).
const DEFAULT_PRACTICE_COUNT = 10;

// The most recent history entry per topic (history is newest first).
const lastAttemptByTopic = history => {
  const map = new Map();
  history.forEach(h => {
    if (!map.has(h.topicId)) {
      map.set(h.topicId, h);
    }
  });
  return map;
};

// The most recent history entry per test (history is newest first).
const lastAttemptByTest = mockHistory => {
  const map = new Map();
  mockHistory.forEach(h => {
    if (!map.has(h.testId)) {
      map.set(h.testId, h);
    }
  });
  return map;
};

// tree: selectSyllabusTree's output. mockTests: fetchMockTests's output.
// history: selectPracticeHistory's output. mockHistory: selectMockHistory's output.
// examName: for the "Type • Exam" subtitle (left out when the student has several exams).
export const buildCatalog = ({
  tree,
  mockTests,
  history,
  mockHistory = [],
  examName,
}) => {
  const lastByTopic = lastAttemptByTopic(history);
  const lastByTest = lastAttemptByTest(mockHistory);
  const subtitle = kind =>
    examName ? `${KIND_META[kind].label} • ${examName}` : KIND_META[kind].label;
  const rows = [];

  tree.forEach(subject => {
    subject.chapters.forEach(chapter => {
      const [firstTopic] = chapter.topics;
      if (firstTopic) {
        rows.push({
          id: `chapter-${chapter.id}`,
          kind: 'chapter',
          title: `${chapter.name} – Mix Questions`,
          subtitle: subtitle('chapter'),
          questions: null,
          minutes: null,
          tag: `${chapter.topicCount} topic${
            chapter.topicCount === 1 ? '' : 's'
          }`,
          topicId: firstTopic.id,
          locked: chapter.locked,
          attempted: false,
          accuracy: null,
        });
      }
      chapter.topics.forEach(topic => {
        const last = lastByTopic.get(topic.id);
        rows.push({
          id: `practice-${topic.id}`,
          kind: 'practice',
          title: topic.name,
          subtitle: subtitle('practice'),
          questions: DEFAULT_PRACTICE_COUNT,
          minutes: null,
          tag: 'Untimed practice',
          topicId: topic.id,
          locked: topic.locked || chapter.locked,
          attempted: Boolean(last),
          accuracy: last?.accuracy ?? null,
        });
      });
    });
  });

  mockTests.forEach(test => {
    // 'topic'-type mock entries would just duplicate our own per-topic practice rows
    // above (both are "test one topic"), so only full papers, PYQs and subject papers
    // get their own row here.
    if (test.type === 'topic') {
      return;
    }
    const kind = test.type === 'subject' ? 'subject' : 'mock'; // full + pyq -> mock
    const last = lastByTest.get(test.id);
    rows.push({
      id: `mock-${test.id}`,
      kind,
      title: test.name,
      subtitle: subtitle(kind),
      questions: test.questions,
      minutes: test.minutes,
      tag:
        kind === 'mock' ? 'Latest Pattern' : DIFFICULTY_LABEL[test.difficulty],
      mockId: test.id,
      locked: false,
      attempted: Boolean(last),
      accuracy: last?.accuracy ?? null,
    });
  });

  return rows;
};

export const filterCatalog = (rows, { category = 'all', query = '' } = {}) => {
  const q = query.trim().toLowerCase();
  return rows.filter(
    row =>
      (category === 'all' || row.kind === category) &&
      (!q ||
        row.title.toLowerCase().includes(q) ||
        row.subtitle.toLowerCase().includes(q)),
  );
};

const KIND_ORDER = { mock: 0, subject: 1, practice: 2, chapter: 3 };

export const sortCatalog = (rows, sortId) => {
  const copy = [...rows];
  if (sortId === 'az') {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortId === 'questions') {
    return copy.sort((a, b) => (b.questions ?? 0) - (a.questions ?? 0));
  }
  return copy.sort(
    (a, b) =>
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title),
  );
};

// Available / attempted / average score for the stats row. Average score is null
// (shown as "—") until the student has attempted at least one scored test.
export const computeCatalogStats = rows => {
  const attemptedRows = rows.filter(row => row.attempted);
  const scored = attemptedRows
    .map(row => row.accuracy)
    .filter(a => a !== null && a !== undefined);
  return {
    available: rows.length,
    attempted: attemptedRows.length,
    averageScore: scored.length
      ? Math.round(scored.reduce((sum, a) => sum + a, 0) / scored.length)
      : null,
  };
};

// The full mock test to feature in "Recommended for You": the most popular, and
// (when different) the newest. Both null when there is no full-length mock yet.
export const pickRecommended = mockTests => {
  const full = mockTests.filter(t => t.type === 'full');
  const popular =
    [...full].sort((a, b) => b.popularity - a.popularity)[0] ?? null;
  const latestRaw = [...full].sort((a, b) => b.order - a.order)[0] ?? null;
  const latest = latestRaw?.id === popular?.id ? null : latestRaw;
  return { popular, latest };
};
