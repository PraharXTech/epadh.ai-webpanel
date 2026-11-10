// Mock syllabus tree. Real endpoints: GET /exams/:id/subjects, /subjects/:id/chapters,
// /chapters/:id/topics (admin-managed). One call returns the whole tree here so the
// app can cache it per exam and drill down offline.
//
// `premium: true` marks content beyond the Free range. Whether it is locked is
// decided from the student's entitlements, never hard-coded (see syllabusSelectors).
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';
import { mockSubjectIds } from '@/features/exams/services/mockExamContent';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_SYLLABUS = {
  subjects: [
    {
      id: 'quant',
      name: 'Quantitative Aptitude',
      icon: 'file-text',
      color: '#ea580c',
      bg: 'bg-orange-100',
      chapters: [
        {
          id: 'q-number',
          name: 'Number System',
          topics: [
            { id: 't-number-types', name: 'Types of Numbers' },
            { id: 't-hcf-lcm', name: 'HCF & LCM' },
            { id: 't-divisibility', name: 'Divisibility Rules' },
          ],
        },
        {
          id: 'q-arithmetic',
          name: 'Arithmetic',
          topics: [
            { id: 't-percentage', name: 'Percentage' },
            { id: 't-profit-loss', name: 'Profit & Loss' },
            { id: 't-ratio', name: 'Ratio & Proportion' },
          ],
        },
        {
          id: 'q-advanced',
          name: 'Advanced Maths',
          premium: true,
          topics: [
            { id: 't-time-work', name: 'Time & Work' },
            { id: 't-interest', name: 'Simple & Compound Interest' },
          ],
        },
      ],
    },
    {
      id: 'gk',
      name: 'General Awareness',
      icon: 'book-open',
      color: '#0891b2',
      bg: 'bg-cyan-100',
      chapters: [
        {
          id: 'g-static',
          name: 'Static GK',
          topics: [
            { id: 't-geography', name: 'Indian Geography' },
            { id: 't-polity', name: 'Indian Polity' },
          ],
        },
        {
          id: 'g-current',
          name: 'Current Affairs',
          topics: [
            { id: 't-monthly', name: 'Monthly Current Affairs' },
            { id: 't-awards', name: 'Awards & Honours', premium: true },
          ],
        },
      ],
    },
    {
      id: 'reasoning',
      name: 'Reasoning',
      icon: 'book-open',
      color: '#7c3aed',
      bg: 'bg-violet-100',
      chapters: [
        {
          id: 'r-verbal',
          name: 'Verbal Reasoning',
          topics: [
            { id: 't-blood', name: 'Blood Relation' },
            { id: 't-coding', name: 'Coding-Decoding' },
            { id: 't-series', name: 'Number & Letter Series' },
          ],
        },
        {
          id: 'r-nonverbal',
          name: 'Non-Verbal Reasoning',
          premium: true,
          topics: [
            { id: 't-mirror', name: 'Mirror Images' },
            { id: 't-cubes', name: 'Cubes & Dice' },
          ],
        },
      ],
    },
  ],
};

export const fetchSyllabus = async examId => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/exams/${examId}/subjects`);
    return data;
  }
  await delay();
  const ids = mockSubjectIds(
    examId,
    MOCK_SYLLABUS.subjects.map(s => s.id),
  );
  return {
    ...MOCK_SYLLABUS,
    subjects: MOCK_SYLLABUS.subjects.filter(s => ids.includes(s.id)),
  };
};
