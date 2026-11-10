import { store } from '@/store';
import { logout } from '@/features/auth/store/authSlice';
import {
  aggregateStatus,
  firstError,
  forExam,
  mergeMaterial,
  mergeSyllabus,
} from '@/features/exams/utils/examContent';
import {
  loadSyllabus,
  toggleTopicComplete,
} from '@/features/syllabus/store/syllabusSlice';
import { loadMaterial } from '@/features/material/store/materialSlice';
import { chooseExam } from '@/features/user/store/userSlice';
import { selectMaterialItems } from '@/store/selectors/materialSelectors';
import {
  selectLoadedSyllabusExamIds,
  selectSyllabusProgress,
  selectSyllabusProgressByExam,
  selectSyllabusStatus,
  selectSyllabusTree,
  selectSyllabusTreesByExam,
} from '@/store/selectors/syllabusSelectors';

const topic = id => ({ id, name: id });
const chapter = (id, topics) => ({ id, name: id, topics: topics.map(topic) });
const subject = (id, chapters) => ({ id, name: id, chapters });

describe('merging the syllabus of several exams', () => {
  const pet = [
    subject('quant', [
      chapter('number', ['t1', 't2']),
      chapter('arith', ['t3']),
    ]),
    subject('gk', [chapter('static', ['t4'])]),
  ];
  const gd = [
    subject('quant', [chapter('number', ['t2', 't9'])]),
    subject('reasoning', [chapter('series', ['t5'])]),
  ];

  it('lists a shared subject, chapter and topic once, tagged with its exams', () => {
    const merged = mergeSyllabus([
      { examId: 'pet', subjects: pet },
      { examId: 'gd', subjects: gd },
    ]);
    expect(merged.map(s => s.id)).toEqual(['quant', 'gk', 'reasoning']);

    const quant = merged[0];
    expect(quant.examIds).toEqual(['pet', 'gd']);
    expect(quant.chapters.map(c => c.id)).toEqual(['number', 'arith']);
    expect(quant.chapters[0].topics.map(t => t.id)).toEqual(['t1', 't2', 't9']);
    expect(quant.chapters[0].topics.map(t => t.examIds)).toEqual([
      ['pet'],
      ['pet', 'gd'],
      ['gd'],
    ]);
    expect(merged[1].examIds).toEqual(['pet']);
    expect(merged[2].examIds).toEqual(['gd']);
  });

  it('keeps the order the exams were chosen in and does not touch its input', () => {
    const before = JSON.stringify(pet);
    const merged = mergeSyllabus([
      { examId: 'gd', subjects: gd },
      { examId: 'pet', subjects: pet },
    ]);
    expect(merged.map(s => s.id)).toEqual(['quant', 'reasoning', 'gk']);
    expect(JSON.stringify(pet)).toBe(before);
  });

  it('is empty when no exam has loaded yet', () => {
    expect(mergeSyllabus([])).toEqual([]);
  });

  it('can narrow the merged list to one exam', () => {
    const merged = mergeSyllabus([
      { examId: 'pet', subjects: pet },
      { examId: 'gd', subjects: gd },
    ]);
    expect(forExam(merged, 'gd').map(s => s.id)).toEqual([
      'quant',
      'reasoning',
    ]);
    expect(forExam(merged, 'nope')).toEqual([]);
  });
});

describe('merging study material of several exams', () => {
  it('unions subjects and items by id and tags them with their exams', () => {
    const merged = mergeMaterial([
      {
        examId: 'pet',
        subjects: [{ id: 'quant' }],
        items: [{ id: 'm1' }, { id: 'm2' }],
      },
      {
        examId: 'gd',
        subjects: [{ id: 'quant' }, { id: 'gk' }],
        items: [{ id: 'm2' }, { id: 'm3' }],
      },
    ]);
    expect(merged.subjects.map(s => [s.id, s.examIds])).toEqual([
      ['quant', ['pet', 'gd']],
      ['gk', ['gd']],
    ]);
    expect(merged.items.map(i => [i.id, i.examIds])).toEqual([
      ['m1', ['pet']],
      ['m2', ['pet', 'gd']],
      ['m3', ['gd']],
    ]);
  });
});

describe('one status for several exams', () => {
  const ids = ['pet', 'gd'];

  it('is loading while any exam loads, then failed, then succeeded', () => {
    expect(aggregateStatus({ pet: 'succeeded', gd: 'loading' }, ids)).toBe(
      'loading',
    );
    expect(aggregateStatus({ pet: 'failed', gd: 'loading' }, ids)).toBe(
      'loading',
    );
    expect(aggregateStatus({ pet: 'succeeded', gd: 'failed' }, ids)).toBe(
      'failed',
    );
    expect(aggregateStatus({ pet: 'succeeded', gd: 'succeeded' }, ids)).toBe(
      'succeeded',
    );
  });

  it('is idle before anything started or with no exam', () => {
    expect(aggregateStatus({}, ids)).toBe('idle');
    expect(aggregateStatus({ pet: 'succeeded' }, ids)).toBe('idle');
    expect(aggregateStatus({ pet: 'succeeded' }, [])).toBe('idle');
  });

  it('ignores exams the student no longer has', () => {
    expect(aggregateStatus({ pet: 'succeeded', old: 'failed' }, ['pet'])).toBe(
      'succeeded',
    );
    expect(
      firstError({ old: 'boom', gd: 'No connection' }, ['pet', 'gd']),
    ).toBe('No connection');
    expect(firstError({}, ['pet'])).toBeNull();
  });
});

describe('the store with several exams selected', () => {
  const select = async examIds => {
    const done = store.dispatch(chooseExam({ examIds }));
    await jest.advanceTimersByTimeAsync(1000);
    await done;
  };
  const load = async (thunk, examId) => {
    const done = store.dispatch(thunk(examId));
    await jest.advanceTimersByTimeAsync(2000);
    await done;
  };

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => store.dispatch(logout()));

  it('shows only what the selected exams have loaded', async () => {
    await select(['pet']);
    await load(loadSyllabus, 'pet');
    await load(loadSyllabus, 'gd');

    expect(selectLoadedSyllabusExamIds(store.getState()).sort()).toEqual([
      'gd',
      'pet',
    ]);
    // gd is loaded but not selected: it adds nothing
    expect(Object.keys(selectSyllabusTreesByExam(store.getState()))).toEqual([
      'pet',
    ]);
    const petOnly = selectSyllabusTree(store.getState());

    await select(['pet', 'gd']);
    expect(Object.keys(selectSyllabusTreesByExam(store.getState()))).toEqual([
      'pet',
      'gd',
    ]);
    // the mock serves the same syllabus to every exam, so the union is not bigger
    expect(selectSyllabusTree(store.getState())).toHaveLength(petOnly.length);
  });

  it('reports loading while one of the selected exams is still loading', async () => {
    await select(['pet', 'gd']);
    await load(loadSyllabus, 'pet');
    expect(selectSyllabusStatus(store.getState())).toBe('idle');

    const pending = store.dispatch(loadSyllabus('gd'));
    expect(selectSyllabusStatus(store.getState())).toBe('loading');
    await jest.advanceTimersByTimeAsync(2000);
    await pending;
    expect(selectSyllabusStatus(store.getState())).toBe('succeeded');
  });

  it("keeps the student's progress, and shows it per exam and overall", async () => {
    await select(['pet', 'gd']);
    await load(loadSyllabus, 'pet');
    await load(loadSyllabus, 'gd');
    store.dispatch(toggleTopicComplete('t-number-types'));

    const byExam = selectSyllabusProgressByExam(store.getState());
    expect(Object.keys(byExam)).toEqual(['pet', 'gd']);
    expect(byExam.pet.done).toBe(1);
    expect(byExam.gd.done).toBe(1); // same topic in the mock syllabus
    expect(selectSyllabusProgress(store.getState()).done).toBe(1);

    // dropping an exam does not lose the marks
    await select(['pet']);
    expect(selectSyllabusProgress(store.getState()).done).toBe(1);
  });

  it('shows the material of every selected exam, once, tagged with its exams', async () => {
    await select(['pet']);
    await load(loadMaterial, 'pet');
    const petItems = selectMaterialItems(store.getState());
    expect(petItems.length).toBeGreaterThan(0);

    await select(['gd']);
    expect(selectMaterialItems(store.getState())).toEqual([]); // gd not loaded yet
    await load(loadMaterial, 'gd');
    const gdItems = selectMaterialItems(store.getState());
    // gd covers fewer subjects than pet in the mock
    expect(gdItems.length).toBeGreaterThan(0);
    expect(gdItems.length).toBeLessThan(petItems.length);
    expect(gdItems.every(i => i.examIds.join() === 'gd')).toBe(true);

    await select(['pet', 'gd']);
    const both = selectMaterialItems(store.getState());
    expect(both).toHaveLength(petItems.length); // gd's items are all pet's too
    const shared = both.filter(i => i.examIds.length === 2);
    expect(shared).toHaveLength(gdItems.length);
    expect(both.find(i => i.examIds.join() === 'pet')).toBeDefined();
  });

  it('serves each mock exam its own subjects', async () => {
    await select(['pet', 'police', 'gd', 'chsl']);
    await Promise.all(
      ['pet', 'police', 'gd', 'chsl'].map(id => load(loadSyllabus, id)),
    );
    const byExam = selectSyllabusTreesByExam(store.getState());
    expect(byExam.pet.map(s => s.id)).toEqual(['quant', 'gk', 'reasoning']);
    expect(byExam.police.map(s => s.id)).toEqual(['gk', 'reasoning']);
    expect(byExam.gd.map(s => s.id)).toEqual(['quant', 'reasoning']);
    expect(byExam.chsl.map(s => s.id)).toEqual(['quant', 'gk']);
  });
});
