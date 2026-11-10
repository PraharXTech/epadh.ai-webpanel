// One list for the History screen from the practice, mock and OMR summaries (plan.md §5.17).

export const TABS = [
  { id: 'all', label: 'All' },
  { id: 'practice', label: 'MCQ Practice' },
  { id: 'mock', label: 'Mock Tests' },
  { id: 'omr', label: 'OMR Scans' },
];

export const DATE_FILTERS = [
  { id: 'all', label: 'All time', days: null },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
];

export const PAGE_SIZE = 15;

const DAY_MS = 86400000;

export const practiceRow = h => ({
  kind: 'practice',
  id: h.id,
  title: h.topicName,
  subtitle: `${h.subjectName} · ${h.mode === 'test' ? 'Timed test' : 'Practice'}${
    h.source === 'ai' ? ' · AI' : ''
  }`,
  subject: h.subjectName,
  finishedAt: h.finishedAt,
  scoreText: `${h.score}/${h.total}`,
  accuracy: h.accuracy,
});

export const mockRow = h => ({
  kind: 'mock',
  id: h.id,
  title: h.testName,
  subtitle: h.rankPending
    ? 'Rank on its way'
    : h.rank && h.participants >= 30
      ? `Rank ${h.rank} of ${h.participants}`
      : 'Mock test',
  subject: null,
  finishedAt: h.finishedAt,
  scoreText: `${h.score}/${h.maxScore}`,
  accuracy: h.accuracy,
});

export const omrRow = h => ({
  kind: 'omr',
  id: h.scanId,
  title: h.testName,
  subtitle:
    h.rank && h.participants >= 30
      ? `OMR scan · Rank ${h.rank} of ${h.participants}`
      : 'OMR scan',
  subject: null,
  finishedAt: new Date(h.scannedAt).getTime(),
  scoreText: `${h.score}/${h.maxScore}`,
  accuracy: h.accuracy,
});

const rowsOfTab = (tab, practice, mock, omr) => {
  if (tab === 'all') {
    return [
      ...practice.map(practiceRow),
      ...mock.map(mockRow),
      ...omr.map(omrRow),
    ];
  }
  if (tab === 'practice') {
    return practice.map(practiceRow);
  }
  if (tab === 'omr') {
    return omr.map(omrRow);
  }
  return tab === 'mock' ? mock.map(mockRow) : [];
};

// Rows of one tab ("all" = practice, mocks and OMR scans together), newest first, inside the date
// filter and (practice) subject filter.
export const buildHistoryRows = ({
  tab,
  practice,
  mock,
  omr = [],
  days = null,
  subject = null,
  now = Date.now(),
}) => {
  const rows = rowsOfTab(tab, practice, mock, omr)
    .filter(r => days === null || now - r.finishedAt <= days * DAY_MS)
    .filter(r => !subject || r.subject === subject);
  return rows.sort((a, b) => b.finishedAt - a.finishedAt);
};

export const practiceSubjects = practice => [
  ...new Set(practice.map(h => h.subjectName)),
];
