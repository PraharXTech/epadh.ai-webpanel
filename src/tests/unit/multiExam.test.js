import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import reducer, {
  chooseExam,
  fetchMe,
} from '@/features/user/store/userSlice';
import {
  selectSelectedExamId,
  selectSelectedExamIds,
} from '@/store/selectors/userSelectors';
import {
  selectSelectedExamLabel,
  selectSelectedExams,
} from '@/store/selectors/examSelectors';

const run = async thunk => {
  const promise = store.dispatch(thunk);
  await jest.advanceTimersByTimeAsync(2000);
  return promise;
};

describe('choosing several exams', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => store.dispatch(logout()));

  it('keeps every exam in the order chosen; the first is the primary exam', async () => {
    await run(chooseExam({ examIds: ['gd', 'pet', 'police'] }));
    const state = store.getState();
    expect(selectSelectedExamIds(state)).toEqual(['gd', 'pet', 'police']);
    expect(selectSelectedExamId(state)).toBe('gd');
    expect(state.user.selectedExamId).toBe('gd');
  });

  it('still accepts a single exam, and ignores repeats and blanks', async () => {
    await run(chooseExam({ examId: 'pet' }));
    expect(selectSelectedExamIds(store.getState())).toEqual(['pet']);

    await run(chooseExam({ examIds: ['pet', 'gd', 'pet', null, ''] }));
    expect(selectSelectedExamIds(store.getState())).toEqual(['pet', 'gd']);
  });

  it('refuses an empty choice and keeps the exams it had', async () => {
    await run(chooseExam({ examIds: ['pet'] }));
    const result = await run(chooseExam({ examIds: [] }));
    expect(chooseExam.rejected.match(result)).toBe(true);
    expect(store.getState().user.error).toBe('Pick at least one exam.');
    expect(selectSelectedExamIds(store.getState())).toEqual(['pet']);
  });

  it('shows no exam before one is chosen, and clears on logout', async () => {
    expect(selectSelectedExamIds(store.getState())).toEqual([]);
    expect(selectSelectedExamId(store.getState())).toBeNull();
    expect(selectSelectedExamLabel(store.getState())).toBe('Select exam');

    await run(chooseExam({ examIds: ['pet', 'gd'] }));
    store.dispatch(logout());
    expect(selectSelectedExamIds(store.getState())).toEqual([]);
  });

  it('names the exams from the admin list, falling back to the id until it loads', async () => {
    await run(chooseExam({ examIds: ['pet', 'gd'] }));
    expect(selectSelectedExams(store.getState()).map(e => e.name)).toEqual([
      'pet',
      'gd',
    ]);

    store.dispatch({
      type: 'exams/load/fulfilled',
      payload: [
        { id: 'pet', name: 'UPSSSC PET' },
        { id: 'gd', name: 'SSC GD' },
        { id: 'chsl', name: 'SSC CHSL' },
      ],
    });
    expect(selectSelectedExamLabel(store.getState())).toBe('UPSSSC PET, SSC GD');
  });
});

describe('older saved data', () => {
  it('treats a copy saved with only one exam as a list of one', () => {
    const state = {
      user: { ...reducer(undefined, { type: 'init' }), selectedExamId: 'pet' },
    };
    expect(selectSelectedExamIds(state)).toEqual(['pet']);
    expect(selectSelectedExamId(state)).toBe('pet');
  });

  it('takes the exams the server returns, or one from an older server', () => {
    const base = reducer(undefined, { type: 'init' });
    const entitlements = { plan: 'free' };

    const many = reducer(
      base,
      fetchMe.fulfilled({
        profile: { id: 'u1' },
        selectedExamIds: ['gd', 'pet'],
        entitlements,
      }),
    );
    expect(many.selectedExamIds).toEqual(['gd', 'pet']);
    expect(many.selectedExamId).toBe('gd');

    const legacy = reducer(
      base,
      fetchMe.fulfilled({
        profile: { id: 'u1' },
        selectedExamId: 'chsl',
        entitlements,
      }),
    );
    expect(legacy.selectedExamIds).toEqual(['chsl']);

    // a server that has none must not wipe what the phone saved
    const kept = reducer(
      many,
      fetchMe.fulfilled({ profile: { id: 'u1' }, entitlements }),
    );
    expect(kept.selectedExamIds).toEqual(['gd', 'pet']);
  });
});
