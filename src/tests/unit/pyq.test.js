import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import {
  loadPyqPapers,
  markPaperViewed,
  toggleSavedPaper,
} from '@/features/pyq/store/pyqSlice';
import {
  describePaper,
  filterPapers,
  paperLabel,
  paperYears,
  sortPapers,
} from '@/features/pyq/utils/pyq';
import {
  selectPyqPaperById,
  selectPyqPapers,
} from '@/store/selectors/pyqSelectors';

const p = (id, year, shift = null, extra = {}) => ({
  id,
  examId: 'pet',
  title: `Paper ${year}`,
  year,
  shift,
  language: 'English',
  pages: 10,
  sizeMb: 1.5,
  ...extra,
});

const PAPERS = [
  p('a', 2021),
  p('b', 2023, 'Shift 2'),
  p('c', 2023, 'Shift 1'),
  p('d', 2022, null, { language: 'Hindi' }),
];

describe('paper helpers', () => {
  it('sorts newest year first, then shift', () => {
    expect(sortPapers(PAPERS).map(x => x.id)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('lists the distinct years, newest first', () => {
    expect(paperYears(PAPERS)).toEqual([2023, 2022, 2021]);
  });

  it('labels and describes a paper', () => {
    expect(paperLabel(p('x', 2024, 'Shift 1'))).toBe('2024 • Shift 1');
    expect(paperLabel(p('x', 2023))).toBe('2023');
    expect(describePaper(p('x', 2023))).toBe('English • 10 pages • 1.5 MB');
    expect(describePaper({ language: 'Hindi' })).toBe('Hindi');
  });

  it('filters by year, saved and search', () => {
    const saved = { d: true };
    const run = opts =>
      filterPapers(PAPERS, { filter: 'all', query: '', saved, ...opts }).map(
        x => x.id,
      );
    expect(run({})).toEqual(['a', 'b', 'c', 'd']);
    expect(run({ filter: '2023' })).toEqual(['b', 'c']);
    expect(run({ filter: 'saved' })).toEqual(['d']);
    expect(run({ query: 'shift 1' })).toEqual(['c']);
    expect(run({ query: ' hindi ' })).toEqual(['d']);
    expect(run({ filter: '2023', query: '2021' })).toEqual([]);
  });
});

const selectExams = examIds =>
  store.dispatch({ type: chooseExam.fulfilled.type, payload: { examIds } });

describe('pyq slice', () => {
  beforeEach(() => {
    store.dispatch(logout());
    selectExams(['pet']);
  });

  it('keeps the loaded list, saved and viewed papers, and logout clears them', () => {
    store.dispatch({
      type: loadPyqPapers.fulfilled.type,
      payload: { papers: PAPERS },
    });
    store.dispatch(toggleSavedPaper('a'));
    store.dispatch(markPaperViewed('b'));

    const state = store.getState();
    expect(selectPyqPapers(state).map(x => x.id)).toEqual(['c', 'b', 'd', 'a']);
    expect(selectPyqPaperById(state, 'd').year).toBe(2022);
    expect(state.pyq.saved).toEqual({ a: true });
    expect(typeof state.pyq.viewed.b).toBe('number');

    store.dispatch(toggleSavedPaper('a'));
    expect(store.getState().pyq.saved).toEqual({});

    store.dispatch(logout());
    expect(store.getState().pyq.papers).toEqual([]);
    expect(store.getState().pyq.viewed).toEqual({});
  });

  it('a refetch keeps what the student saved', () => {
    store.dispatch(toggleSavedPaper('a'));
    store.dispatch({
      type: loadPyqPapers.fulfilled.type,
      payload: { papers: PAPERS },
    });
    expect(store.getState().pyq.saved).toEqual({ a: true });
  });

  it('records a failed load and keeps the old list', () => {
    store.dispatch({
      type: loadPyqPapers.fulfilled.type,
      payload: { papers: PAPERS },
    });
    store.dispatch({
      type: loadPyqPapers.rejected.type,
      payload: 'No connection',
    });
    expect(store.getState().pyq.status).toBe('failed');
    expect(store.getState().pyq.error).toBe('No connection');
    expect(store.getState().pyq.papers).toHaveLength(4);
  });
});

describe('papers of several exams', () => {
  const MIXED = [
    p('pet-1', 2023),
    p('pet-2', 2021),
    p('gd-1', 2024, null, { examId: 'gd' }),
    p('chsl-1', 2022, null, { examId: 'chsl' }),
  ];
  const ids = () => selectPyqPapers(store.getState()).map(x => x.id);

  beforeEach(() => {
    store.dispatch(logout());
    store.dispatch({
      type: loadPyqPapers.fulfilled.type,
      payload: { papers: MIXED },
    });
  });

  it('shows only the papers of the exams the student prepares for', () => {
    selectExams(['pet']);
    expect(ids()).toEqual(['pet-1', 'pet-2']);
    selectExams(['gd']);
    expect(ids()).toEqual(['gd-1']);
  });

  it('mixes the papers of every selected exam, newest year first', () => {
    selectExams(['pet', 'gd']);
    expect(ids()).toEqual(['gd-1', 'pet-1', 'pet-2']);
  });

  it('shows nothing until an exam is chosen, but can still open any saved paper', () => {
    expect(ids()).toEqual([]);
    expect(selectPyqPaperById(store.getState(), 'chsl-1').year).toBe(2022);
  });
});
