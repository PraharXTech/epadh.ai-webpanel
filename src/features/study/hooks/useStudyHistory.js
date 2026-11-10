import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useMaterial from '@/features/material/hooks/useMaterial';
import { planTopics } from '@/features/plan/utils/planBuilder';
import useSyllabus from '@/features/syllabus/hooks/useSyllabus';
import { selectMaterialItems } from '@/store/selectors/materialSelectors';
import { selectSyllabusTree } from '@/store/selectors/syllabusSelectors';
import { historyByDay } from '../utils/streak';

const TYPE_LABEL = {
  study: 'Study',
  practice: 'Practice',
  test: 'Timed test',
  ai: 'Ask epadh.ai',
};

// The finished study sessions of the last `n` days, grouped by day, each with a readable name
// (the topic or the material it was spent on).
export default function useStudyHistory(sessions, today, n = 14) {
  useSyllabus(); // so names resolve on a cold visit (both are cached after the first load)
  useMaterial();
  const tree = useSelector(selectSyllabusTree);
  const materials = useSelector(selectMaterialItems);

  return useMemo(() => {
    const names = new Map();
    planTopics(tree).forEach(topic => names.set(topic.id, topic.name));
    materials.forEach(item => names.set(item.id, item.title));
    return historyByDay(sessions, n, today).map(group => ({
      ...group,
      sessions: group.sessions.map(s => ({
        ...s,
        name: names.get(s.refId) ?? 'Study session',
        typeLabel: TYPE_LABEL[s.type] ?? 'Study',
      })),
    }));
  }, [sessions, tree, materials, today, n]);
}
