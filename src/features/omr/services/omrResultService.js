// OMR result + leaderboard for a scanned sheet. Real endpoints (plan.md §5.12):
//   GET /omr/scan/:scanId/result      -> the graded sheet
//   GET /omr/scan/:scanId/leaderboard -> { entries, me, participants }
// The mock grades a made-up answer sheet that is the same every time for a given
// scanId, so the result and the leaderboard always agree with each other.
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';
import {
  OPTION_LETTERS,
  maskName,
  percentileOf,
  rankEntries,
  scoreSheet,
} from '../utils/omrResult';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const LEADERBOARD_SIZE = 20;
const PARTICIPANTS = 120;
const MARKING = { correct: 3, wrong: -1 };
const SECTIONS = [
  'General Studies',
  'Current Affairs',
  'Reasoning',
  'Quantitative Aptitude',
];
const QUESTIONS_PER_SECTION = 25;

const FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Ananya',
  'Diya',
  'Rohan',
  'Priya',
  'Kabir',
  'Ishita',
  'Aditya',
  'Meera',
  'Arjun',
  'Saanvi',
  'Karan',
  'Neha',
  'Rahul',
  'Pooja',
  'Vikram',
  'Sneha',
  'Manish',
  'Kavya',
];
const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Singh',
  'Gupta',
  'Yadav',
  'Mishra',
  'Patel',
  'Kumar',
  'Tiwari',
  'Pandey',
];

// Small seeded generator (mulberry32) so a scanId always produces the same sheet.
/* eslint-disable no-bitwise */
const seededRandom = seedText => {
  let h = 1779033703;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* eslint-enable no-bitwise */

const buildMock = (scanId, studentName) => {
  const random = seededRandom(scanId);
  const pickOption = () => Math.floor(random() * OPTION_LETTERS.length);

  const answers = [];
  SECTIONS.forEach((section, sectionIndex) => {
    // Sections differ a little in difficulty so the breakdown is worth reading.
    const strength = [0.62, 0.5, 0.45, 0.38][sectionIndex];
    for (let i = 0; i < QUESTIONS_PER_SECTION; i += 1) {
      const correct = pickOption();
      let marked = null;
      if (random() < 0.88) {
        marked = random() < strength ? correct : (correct + 1 + Math.floor(random() * 3)) % 4;
      }
      answers.push({ no: answers.length + 1, section, marked, correct });
    }
  });
  const sheet = scoreSheet({ answers, sections: SECTIONS, marking: MARKING });

  const others = Array.from({ length: PARTICIPANTS - 1 }, (_, i) => {
    const attempted = 60 + Math.floor(random() * 40);
    const right = Math.round(attempted * (0.3 + random() * 0.55));
    return {
      id: `p${i}`,
      name: `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${
        LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
      }`,
      score: right * MARKING.correct + (attempted - right) * MARKING.wrong,
      correct: right,
      attempted,
    };
  });
  const me = {
    id: 'me',
    name: studentName || 'You',
    score: sheet.score,
    correct: sheet.correct,
    attempted: sheet.attempted,
    isYou: true,
  };
  const ranked = rankEntries([...others, me]).map(entry => ({
    id: entry.id,
    rank: entry.rank,
    name: entry.isYou ? entry.name : maskName(entry.name),
    score: entry.score,
    accuracy: entry.attempted ? Math.round((entry.correct / entry.attempted) * 100) : 0,
    isYou: Boolean(entry.isYou),
  }));
  const mine = ranked.find(entry => entry.isYou);

  return {
    result: {
      scanId,
      testName: 'UPSSSC PET Mock Test 1',
      examName: 'UPSSSC PET',
      answerKey: { id: 'AK0001', name: 'UPSSSC PET Mock Test 1' },
      scannedAt: new Date().toISOString(),
      durationMin: 120,
      marking: MARKING,
      ...sheet,
      rank: mine.rank,
      participants: ranked.length,
      percentile: percentileOf(mine.rank, ranked.length),
    },
    leaderboard: {
      entries: ranked.slice(0, LEADERBOARD_SIZE),
      me: mine,
      participants: ranked.length,
    },
  };
};

export const fetchOmrResult = async ({ scanId, studentName }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/omr/scan/${scanId}/result`);
    return data;
  }
  await delay(600);
  return buildMock(scanId, studentName).result;
};

export const fetchOmrLeaderboard = async ({ scanId, studentName }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/omr/scan/${scanId}/leaderboard`);
    return data;
  }
  await delay(400);
  return buildMock(scanId, studentName).leaderboard;
};
