// Mock exam list. Real endpoint: GET /exams (admin-managed, so never hard-code).
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_EXAMS = [
  {
    id: 'pet',
    name: 'UPSSSC PET',
    icon: 'landmark',
    color: '#475569',
    bg: 'bg-slate-100',
    subjectCount: 6,
    description: 'Preliminary Eligibility Test',
  },
  {
    id: 'police',
    name: 'UP Police',
    icon: 'shield-check',
    color: '#1d4ed8',
    bg: 'bg-blue-50',
    subjectCount: 5,
    description: 'Constable recruitment',
  },
  {
    id: 'gd',
    name: 'SSC GD',
    icon: 'medal',
    color: '#b91c1c',
    bg: 'bg-red-50',
    subjectCount: 4,
    description: 'General Duty Constable',
  },
  {
    id: 'chsl',
    name: 'SSC CHSL',
    icon: 'medal',
    color: '#b45309',
    bg: 'bg-amber-50',
    subjectCount: 4,
    description: 'Combined Higher Secondary Level',
  },
];

export const fetchExams = async () => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get('/exams');
    return data;
  }
  await delay();
  return MOCK_EXAMS;
};
