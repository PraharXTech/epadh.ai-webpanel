import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import {
  loadMaterial,
  markDownloaded,
  setQuery,
  setSubjectFilter,
  setTypeFilter,
  addTimeSpent,
  setFontSize,
  setProgress,
  toggleBookmark,
} from '@/features/material/store/materialSlice';
import { describeItem } from '@/features/material/utils/format';
import {
  selectMaterialItems,
  selectMaterialSections,
} from '@/store/selectors/materialSelectors';

const titles = () =>
  selectMaterialSections(store.getState()).flatMap(s =>
    s.items.map(i => i.title),
  );

describe('study material', () => {
  beforeAll(async () => {
    jest.useFakeTimers();
    const choosing = store.dispatch(chooseExam({ examId: 'pet' }));
    await jest.advanceTimersByTimeAsync(1000);
    await choosing;
    const promise = store.dispatch(loadMaterial('pet'));
    await jest.advanceTimersByTimeAsync(2000);
    await promise;
  });
  afterAll(() => jest.useRealTimers());

  it('groups everything by subject when unfiltered', () => {
    const sections = selectMaterialSections(store.getState());
    expect(sections.map(s => s.subject.name)).toEqual([
      'Quantitative Aptitude',
      'General Awareness',
      'Reasoning',
    ]);
  });

  it('filters by type and drops subjects left empty', () => {
    store.dispatch(setTypeFilter('video'));
    const sections = selectMaterialSections(store.getState());
    expect(sections).toHaveLength(3);
    expect(titles()).toContain('Indian Polity – Video Lectures');
    expect(titles()).not.toContain('Number System – Complete Notes');
  });

  it('shows practice sets under Notes', () => {
    store.dispatch(setTypeFilter('notes'));
    expect(titles()).toContain('Profit & Loss – Important Questions');
    expect(titles()).not.toContain('Percentage – Concept & Questions');
  });

  it('filters by subject and by search text', () => {
    store.dispatch(setTypeFilter('all'));
    store.dispatch(setSubjectFilter('reasoning'));
    expect(titles()).toHaveLength(3);
    store.dispatch(setQuery('blood'));
    expect(titles()).toEqual(['Blood Relation – Notes & Tricks']);
    store.dispatch(setSubjectFilter(null));
    store.dispatch(setQuery(''));
  });

  it('bookmarks toggle and downloads persist independently of the list', () => {
    store.dispatch(toggleBookmark('m1'));
    store.dispatch(markDownloaded('m5'));
    expect(store.getState().material.bookmarks).toEqual({ m1: true });
    expect(store.getState().material.downloads).toEqual({ m5: true });
    store.dispatch(toggleBookmark('m1'));
    expect(store.getState().material.bookmarks).toEqual({});
  });

  it('describes each kind of item like the design', () => {
    const item = id =>
      selectMaterialItems(store.getState()).find(i => i.id === id);
    expect(describeItem(item('m1'))).toBe('PDF • 3.2 MB • 45 Pages');
    expect(describeItem(item('m2'))).toBe('Video • 42 min');
    expect(describeItem(item('m3'))).toBe('Practice Questions • 50 Qs');
    expect(describeItem(item('m6'))).toBe('Video • 1 hr 20 min');
    expect(describeItem(item('m7'))).toBe('PDF • Sep 2025 • 8.3 MB');
    expect(describeItem(item('m12'))).toBe('Article • Sep 2025');
  });

  it('lets saved progress override the seeded value and clamps it', () => {
    const find = id =>
      selectMaterialItems(store.getState()).find(i => i.id === id);
    expect(find('m2').progress).toBe(75); // seeded by the server
    store.dispatch(setProgress({ id: 'm2', percent: 12.4 }));
    expect(find('m2').progress).toBe(12);
    store.dispatch(setProgress({ id: 'm2', percent: 250 }));
    expect(find('m2').progress).toBe(100);
    expect(
      store.getState().material.byExam.pet.items.find(i => i.id === 'm2')
        .progress,
    ).toBe(75);
  });

  it('gives every material something to open: a file url or rich text', () => {
    const items = selectMaterialItems(store.getState());
    expect(
      items.every(i =>
        i.format === 'html' ? i.body : i.url?.startsWith('https://'),
      ),
    ).toBe(true);
  });

  it('links material to syllabus topics', () => {
    const items = selectMaterialItems(store.getState());
    expect(items.find(i => i.id === 'm1').topicId).toBe('t-number-types');
    expect(
      items.filter(i => i.topicId === 't-number-types').map(i => i.id),
    ).toEqual(['m1', 'm12']);
  });

  it('remembers time spent and the reader text size, within limits', () => {
    store.dispatch(addTimeSpent({ id: 'm1', seconds: 30.4 }));
    store.dispatch(addTimeSpent({ id: 'm1', seconds: 45 }));
    expect(store.getState().material.timeSpent.m1).toBe(75);
    store.dispatch(setFontSize(20));
    expect(store.getState().material.fontSize).toBe(20);
    store.dispatch(setFontSize(99));
    expect(store.getState().material.fontSize).toBe(28);
    store.dispatch(setFontSize(2));
    expect(store.getState().material.fontSize).toBe(12);
  });

  it('is cleared on logout', () => {
    store.dispatch(logout());
    expect(store.getState().material.byExam).toEqual({});
    expect(selectMaterialItems(store.getState())).toEqual([]);
  });
});
