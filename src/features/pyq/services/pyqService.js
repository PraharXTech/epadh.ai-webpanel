// Mock previous-year papers. Real endpoint: GET /pyq-papers (every exam's papers; the
// admin uploads each paper to S3 and tags it with its exam):
//   [{ id, examId, examName, title, year, shift, language, pages, sizeMb, url,
//      answerKeyUrl, mockId, premium }]
//   examId       the exam it belongs to (matches GET /exams), the app filters by it
//   shift        'Shift 1' | null
//   answerKeyUrl PDF of the answer key / solutions, or null when none was uploaded
//   mockId       id of the same paper as an attemptable mock test, or null
//   premium      Pro only (the server withholds `url` for a Free student; the app locks it too)
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

// A public sample file standing in for every uploaded PDF.
const SAMPLE_PDF =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const paper = (examId, examName, year, shift, extra = {}) => ({
  id: `${examId}-${year}${shift ? `-s${shift.slice(-1)}` : ''}`,
  examId,
  examName,
  title: `${examName} ${year}${shift ? ` – ${shift}` : ''}`,
  year,
  shift,
  language: 'Hindi + English',
  pages: 24,
  sizeMb: 2.4,
  url: SAMPLE_PDF,
  answerKeyUrl: SAMPLE_PDF,
  mockId: null,
  premium: false,
  ...extra,
});

const PET = ['pet', 'UPSSSC PET'];
const POLICE = ['police', 'UP Police'];
const GD = ['gd', 'SSC GD'];
const CHSL = ['chsl', 'SSC CHSL'];

const MOCK_PAPERS = [
  paper(...PET, 2024, 'Shift 1', { pages: 28, sizeMb: 3.1 }),
  paper(...PET, 2024, 'Shift 2', { pages: 26, sizeMb: 2.9 }),
  paper(...PET, 2023, null, { pages: 32, sizeMb: 3.6, mockId: 'pyq-2023' }),
  paper(...PET, 2022, 'Shift 1', { mockId: 'pyq-2022' }),
  paper(...PET, 2022, 'Shift 2', { answerKeyUrl: null }),
  paper(...PET, 2021, null, { language: 'English' }),
  paper(...PET, 2019, null, { premium: true, pages: 20, sizeMb: 1.8 }),
  paper(...PET, 2018, null, { premium: true, pages: 22, sizeMb: 2.0 }),

  paper(...POLICE, 2024, null, { pages: 40, sizeMb: 4.2 }),
  paper(...POLICE, 2023, null, { pages: 38, sizeMb: 3.9 }),
  paper(...POLICE, 2021, null, { language: 'Hindi', answerKeyUrl: null }),
  paper(...POLICE, 2018, null, { premium: true }),

  paper(...GD, 2024, 'Shift 1', { language: 'English' }),
  paper(...GD, 2024, 'Shift 2', { language: 'English' }),
  paper(...GD, 2023, null, { language: 'English' }),

  paper(...CHSL, 2023, 'Shift 1', { language: 'English', pages: 30 }),
  paper(...CHSL, 2023, 'Shift 2', { language: 'English', pages: 30 }),
  paper(...CHSL, 2022, null, { language: 'English', premium: true }),
];

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPyqPapers = async () => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/pyq-papers');
    return data;
  }
  await delay();
  return MOCK_PAPERS;
};
