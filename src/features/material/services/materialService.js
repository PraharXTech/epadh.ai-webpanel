// Mock study material. Real endpoint: GET /exams/:examId/materials
// (admin uploads to S3; each item carries the `url` of its PDF or video).
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';
import { mockSubjectIds } from '@/features/exams/services/mockExamContent';

// Public sample files standing in for the uploaded PDFs / videos.
const SAMPLE_PDF =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const SAMPLE_VIDEO_A =
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4';
const SAMPLE_VIDEO_B =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const NUMBER_TYPES_HTML = `
<h2>Types of Numbers</h2>
<p>Every number in the exam falls into one of these families. Learn the definitions once and most questions become a quick check.</p>
<h3>Natural and whole numbers</h3>
<ul>
  <li><b>Natural numbers:</b> 1, 2, 3, 4 ... (counting numbers)</li>
  <li><b>Whole numbers:</b> 0, 1, 2, 3 ... (natural numbers plus zero)</li>
</ul>
<h3>Integers</h3>
<p>... -3, -2, -1, 0, 1, 2, 3 ... Positive and negative whole numbers along with zero.</p>
<h3>Prime and composite</h3>
<ul>
  <li><b>Prime:</b> exactly two factors, 1 and itself (2, 3, 5, 7, 11, 13 ...)</li>
  <li><b>Composite:</b> more than two factors (4, 6, 8, 9, 10 ...)</li>
  <li>1 is neither prime nor composite, and 2 is the only even prime.</li>
</ul>
<h3>Rational and irrational</h3>
<p>A <b>rational</b> number can be written as p/q with q not zero (for example 3/4, 0.5, -2). An <b>irrational</b> number cannot (for example &#8730;2, &#960;).</p>
<h3>Exam tip</h3>
<p>Count of primes up to 100 is <b>25</b>. Remember it, it is asked often.</p>
`;

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// type: notes | video | practice | pyq
// A PDF by default; `format: 'html'` items carry rich text in `body` instead.
// `topicId` links an item to the syllabus topic it belongs to (optional).
const MOCK_MATERIAL = {
  subjects: [
    {
      id: 'quant',
      name: 'Quantitative Aptitude',
      icon: 'file-text',
      color: '#ea580c',
      bg: 'bg-orange-100',
    },
    {
      id: 'gk',
      name: 'General Awareness',
      icon: 'book-open',
      color: '#0891b2',
      bg: 'bg-cyan-100',
    },
    {
      id: 'reasoning',
      name: 'Reasoning',
      icon: 'book-open',
      color: '#7c3aed',
      bg: 'bg-violet-100',
    },
  ],
  items: [
    {
      id: 'm1',
      topicId: 't-number-types',
      subjectId: 'quant',
      type: 'notes',
      url: SAMPLE_PDF,
      title: 'Number System – Complete Notes',
      sizeMb: 3.2,
      pages: 45,
    },
    {
      id: 'm2',
      topicId: 't-percentage',
      subjectId: 'quant',
      type: 'video',
      url: SAMPLE_VIDEO_A,
      title: 'Percentage – Concept & Questions',
      durationMin: 42,
      progress: 75,
    },
    {
      id: 'm3',
      topicId: 't-profit-loss',
      subjectId: 'quant',
      type: 'practice',
      url: SAMPLE_PDF,
      title: 'Profit & Loss – Important Questions',
      questions: 50,
    },
    {
      id: 'm4',
      topicId: 't-ratio',
      subjectId: 'quant',
      type: 'pyq',
      url: SAMPLE_PDF,
      title: 'SSC CGL PYQs (2018–2024)',
      sizeMb: 5.6,
      pages: 120,
    },
    {
      id: 'm5',
      topicId: 't-geography',
      subjectId: 'gk',
      type: 'notes',
      url: SAMPLE_PDF,
      title: 'Static GK – Complete Notes',
      sizeMb: 4.1,
      pages: 60,
    },
    {
      id: 'm6',
      topicId: 't-polity',
      subjectId: 'gk',
      type: 'video',
      url: SAMPLE_VIDEO_B,
      title: 'Indian Polity – Video Lectures',
      durationMin: 80,
      progress: 40,
    },
    {
      id: 'm7',
      topicId: 't-monthly',
      subjectId: 'gk',
      type: 'notes',
      url: SAMPLE_PDF,
      title: 'Current Affairs (Monthly PDFs)',
      sizeMb: 8.3,
      dateLabel: 'Sep 2025',
    },
    {
      id: 'm9',
      topicId: 't-blood',
      subjectId: 'reasoning',
      type: 'notes',
      url: SAMPLE_PDF,
      title: 'Blood Relation – Notes & Tricks',
      sizeMb: 2.4,
      pages: 32,
    },
    {
      id: 'm10',
      topicId: 't-coding',
      subjectId: 'reasoning',
      type: 'video',
      url: SAMPLE_VIDEO_A,
      title: 'Coding Decoding – Practice Session',
      durationMin: 38,
    },
    {
      id: 'm11',
      topicId: 't-series',
      subjectId: 'reasoning',
      type: 'pyq',
      url: SAMPLE_PDF,
      title: 'Reasoning PYQs (2019–2024)',
      sizeMb: 3.9,
      pages: 80,
    },
    {
      id: 'm12',
      subjectId: 'quant',
      topicId: 't-number-types',
      type: 'notes',
      format: 'html',
      title: 'Types of Numbers – Quick Revision',
      dateLabel: 'Sep 2025',
      body: NUMBER_TYPES_HTML,
    },
  ],
};

export const fetchMaterial = async examId => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/exams/${examId}/materials`);
    return data;
  }
  await delay();
  const ids = mockSubjectIds(
    examId,
    MOCK_MATERIAL.subjects.map(s => s.id),
  );
  return {
    subjects: MOCK_MATERIAL.subjects.filter(s => ids.includes(s.id)),
    items: MOCK_MATERIAL.items.filter(i => ids.includes(i.subjectId)),
  };
};
