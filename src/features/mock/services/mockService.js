// Mock data layer for the Mock Tests screen. Swap the body for a real API call
// (src/api) once the backend has mock tests. `progress` is the percent of the last
// attempt (null = not attempted); `order` grows with how recently the test was added.
// `subjects` lists which question sections the paper is built from (questionBank.js);
// `negativePerWrong` is the fraction of a question's own marks lost per wrong answer.
import { generateMockPaper } from '../utils/questionGenerator';
const TESTS = [
  {
    id: 'full-01',
    type: 'full',
    name: 'Full Mock Test 01',
    subtitle: 'Based on latest exam pattern',
    questions: 90,
    minutes: 60,
    marks: 180,
    difficulty: 1,
    popularity: 100,
    order: 1,
    progress: null,
    subjects: ['quant', 'reasoning', 'gk'],
    negativePerWrong: 0.25,
  },
  {
    id: 'full-02',
    type: 'full',
    name: 'Full Mock Test 02',
    subtitle: 'Moderate level',
    questions: 90,
    minutes: 60,
    marks: 180,
    difficulty: 2,
    popularity: 90,
    order: 2,
    progress: null,
    subjects: ['quant', 'reasoning', 'gk'],
    negativePerWrong: 0.25,
  },
  {
    id: 'subject-quant',
    type: 'subject',
    name: 'Quantitative Aptitude Mock Test',
    subtitle: 'Number System, Simplification, Percentage',
    questions: 25,
    minutes: 25,
    marks: 50,
    difficulty: 2,
    popularity: 70,
    order: 3,
    progress: 60,
    subjects: ['quant'],
    negativePerWrong: 0.25,
  },
  {
    id: 'subject-reasoning',
    type: 'subject',
    name: 'Reasoning Mock Test',
    subtitle: 'Analogy, Classification, Series',
    questions: 25,
    minutes: 25,
    marks: 50,
    difficulty: 1,
    popularity: 65,
    order: 4,
    progress: 40,
    subjects: ['reasoning'],
    negativePerWrong: 0.25,
  },
  {
    id: 'pyq-2023',
    type: 'pyq',
    name: 'Previous Year Paper 2023',
    subtitle: 'Actual exam questions',
    questions: 90,
    minutes: 60,
    marks: 180,
    difficulty: 3,
    popularity: 80,
    order: 5,
    progress: null,
    subjects: ['quant', 'reasoning', 'gk'],
    negativePerWrong: 0.25,
    premium: true,
  },
  {
    id: 'pyq-2022',
    type: 'pyq',
    name: 'Previous Year Paper 2022',
    subtitle: 'Actual exam questions',
    questions: 90,
    minutes: 60,
    marks: 180,
    difficulty: 3,
    popularity: 60,
    order: 6,
    progress: null,
    subjects: ['quant', 'reasoning', 'gk'],
    negativePerWrong: 0.25,
    premium: true,
  },
  {
    id: 'topic-percentage',
    type: 'topic',
    name: 'Percentage Topic Test',
    subtitle: 'Percentage, Profit & Loss',
    questions: 15,
    minutes: 15,
    marks: 30,
    difficulty: 1,
    popularity: 40,
    order: 7,
    progress: null,
    subjects: ['quant'],
    negativePerWrong: 0,
  },
  {
    id: 'topic-ratio',
    type: 'topic',
    name: 'Ratio & Proportion Topic Test',
    subtitle: 'Ratio, Proportion, Partnership',
    questions: 15,
    minutes: 15,
    marks: 30,
    difficulty: 2,
    popularity: 35,
    order: 8,
    progress: 85,
    subjects: ['quant'],
    negativePerWrong: 0,
  },
];

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchMockTests = async () => {
  await delay();
  return TESTS;
};

export const fetchMockTestById = async id => {
  await delay(200);
  return TESTS.find(t => t.id === id) ?? null;
};

// The paper for one attempt. Real endpoint: GET /mocks/:id (with its answer key,
// admin-managed); generated locally for now, see utils/questionGenerator.js.
export const fetchMockQuestions = async test => {
  await delay(400);
  return generateMockPaper({ subjects: test.subjects, count: test.questions });
};

// Mock leaderboard: rank and percentile among a plausible pool of platform
// participants (plan.md §21 — "ranking is among platform participants, not an
// official national rank", shown as a disclaimer on the result screen).
// Real endpoint: POST /mocks/:id/submit -> { rank, participants, percentile }.
export const submitMockAttempt = async ({ scorePercent }) => {
  await delay(500);
  const participants = 200 + Math.round(Math.random() * 400);
  // A better score should usually rank better, with a little noise so it isn't
  // a bare formula: mix the score with a random factor before ranking.
  const noisy = Math.min(
    100,
    Math.max(0, scorePercent + (Math.random() * 20 - 10)),
  );
  const rank = Math.max(1, Math.round(((100 - noisy) / 100) * participants));
  const percentile = Math.round(((participants - rank) / participants) * 100);
  return { rank, participants, percentile };
};

// The server's clock, so a test's deadline can't be stretched by changing the phone's
// time (plan.md §5.11). Real endpoint: GET /time -> { now } (ms). The mock has no
// server, so it returns the device clock and the offset comes out as zero.
export const fetchServerTime = async () => {
  await delay(100);
  return Date.now();
};

// Autosave of the attempt in progress. Real endpoint:
// PUT /mocks/:id/attempt { sessionId, answers, marked }. Throws when offline, which
// the slice turns into "will sync when you are back online".
export const saveMockAnswers = async ({ answers, marked }) => {
  await delay(200);
  return {
    saved: Object.keys(answers).length,
    marked: Object.keys(marked).length,
  };
};
