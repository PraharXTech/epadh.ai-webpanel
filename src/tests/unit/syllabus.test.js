import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import {
  loadSyllabus,
  toggleTopicComplete,
} from '@/features/syllabus/store/syllabusSlice';
import {
  selectChapterById,
  selectSubjectById,
  selectSyllabusProgress,
  selectSyllabusTree,
  selectTopicById,
} from '@/store/selectors/syllabusSelectors';

const withPlan = (plan, features = {}) => {
  const state = store.getState();
  return {
    ...state,
    user: {
      ...state.user,
      entitlements: { ...state.user.entitlements, plan, features },
    },
  };
};

describe('syllabus', () => {
  beforeAll(async () => {
    jest.useFakeTimers();
    const choosing = store.dispatch(chooseExam({ examId: 'pet' }));
    await jest.advanceTimersByTimeAsync(1000);
    await choosing;
    const promise = store.dispatch(loadSyllabus('pet'));
    await jest.advanceTimersByTimeAsync(2000);
    await promise;
  });
  afterAll(() => jest.useRealTimers());

  it('is a tree of subject -> chapter -> topic with nothing completed yet', () => {
    const tree = selectSyllabusTree(store.getState());
    expect(tree.map(s => s.name)).toEqual([
      'Quantitative Aptitude',
      'General Awareness',
      'Reasoning',
    ]);
    const quant = tree[0];
    expect(quant.chapterCount).toBe(3);
    expect(quant.topicCount).toBe(8);
    expect(quant.percent).toBe(0);
    expect(selectSyllabusProgress(store.getState())).toMatchObject({
      total: 17,
      done: 0,
      percent: 0,
      subjectCount: 3,
    });
  });

  it('rolls a completed topic up into chapter, subject and overall progress', () => {
    store.dispatch(toggleTopicComplete('t-number-types'));
    store.dispatch(toggleTopicComplete('t-hcf-lcm'));

    const state = store.getState();
    const { chapter } = selectChapterById(state, 'q-number');
    expect(chapter).toMatchObject({
      completedCount: 2,
      topicCount: 3,
      percent: 67,
    });
    expect(selectSubjectById(state, 'quant')).toMatchObject({
      completedCount: 2,
      percent: 25,
    });
    expect(selectSyllabusProgress(state)).toMatchObject({
      done: 2,
      pending: 15,
      percent: 12,
    });
    expect(selectTopicById(state, 't-hcf-lcm').topic.completed).toBe(true);
  });

  it('un-completes a topic when toggled again', () => {
    store.dispatch(toggleTopicComplete('t-hcf-lcm'));
    expect(selectTopicById(store.getState(), 't-hcf-lcm').topic.completed).toBe(
      false,
    );
    expect(selectSyllabusProgress(store.getState()).done).toBe(1);
  });

  it('locks premium chapters and topics for Free students only', () => {
    const free = withPlan('free');
    expect(selectChapterById(free, 'q-advanced').chapter.locked).toBe(true);
    expect(selectTopicById(free, 't-time-work').topic.locked).toBe(true);
    expect(selectTopicById(free, 't-awards').topic.locked).toBe(true); // premium topic, open chapter
    expect(selectChapterById(free, 'g-current').chapter.locked).toBe(false);
    expect(selectTopicById(free, 't-percentage').topic.locked).toBe(false);

    const pro = withPlan('pro');
    expect(selectChapterById(pro, 'q-advanced').chapter.locked).toBe(false);
    expect(selectTopicById(pro, 't-awards').topic.locked).toBe(false);

    const unlocked = withPlan('free', { fullSyllabus: true });
    expect(selectChapterById(unlocked, 'r-nonverbal').chapter.locked).toBe(
      false,
    );
  });

  it('finds nothing for unknown ids', () => {
    const state = store.getState();
    expect(selectSubjectById(state, 'nope')).toBeNull();
    expect(selectChapterById(state, 'nope')).toBeNull();
    expect(selectTopicById(state, 'nope')).toBeNull();
  });

  it('is cleared on logout', () => {
    store.dispatch(logout());
    expect(store.getState().syllabus.trees).toEqual({});
    expect(selectSyllabusTree(store.getState())).toEqual([]);
    expect(store.getState().syllabus.completed).toEqual({});
  });
});
