import { PATHS } from '@/routes/routePaths';

// Where a study-plan task goes when it is opened: the practice setup for practice and weak
// topic tasks, the mock test list for a mock, the topic page for study and revise. Shared by
// the Home card and the Study Plan page.
export const taskPath = task => {
  if (task.type === 'mock') {
    return PATHS.mocks;
  }
  if (task.type === 'practice' || task.type === 'weak') {
    return PATHS.practiceSetup(task.refId);
  }
  return PATHS.topic(task.refId);
};
