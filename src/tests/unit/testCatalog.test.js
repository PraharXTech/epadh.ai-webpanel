import {
  buildCatalog,
  computeCatalogStats,
  filterCatalog,
  pickRecommended,
  sortCatalog,
} from '@/features/tests/utils/catalog';

const topic = (id, overrides = {}) => ({
  id,
  name: id,
  chapterId: 'c1',
  subjectId: 's1',
  completed: false,
  locked: false,
  ...overrides,
});

const tree = [
  {
    id: 's1',
    name: 'Quantitative Aptitude',
    chapters: [
      {
        id: 'c1',
        name: 'Number System',
        locked: false,
        topicCount: 2,
        topics: [topic('t1'), topic('t2', { locked: true })],
      },
      {
        id: 'c2',
        name: 'Advanced Maths',
        locked: true,
        topicCount: 1,
        topics: [topic('t3')],
      },
    ],
  },
];

const mockTests = [
  {
    id: 'full-01',
    type: 'full',
    name: 'Full Mock Test 01',
    subtitle: 'Latest pattern',
    questions: 100,
    minutes: 60,
    difficulty: 1,
    popularity: 100,
    order: 1,
    progress: null,
  },
  {
    id: 'full-02',
    type: 'full',
    name: 'Full Mock Test 02',
    subtitle: 'Moderate',
    questions: 100,
    minutes: 60,
    difficulty: 2,
    popularity: 40,
    order: 2,
    progress: 72,
  },
  {
    id: 'subject-quant',
    type: 'subject',
    name: 'Quant Subject Test',
    subtitle: 'Number system',
    questions: 25,
    minutes: 25,
    difficulty: 2,
    popularity: 70,
    order: 3,
    progress: 60,
  },
];

const history = [{ topicId: 't1', accuracy: 80, finishedAt: 2 }];

describe('buildCatalog', () => {
  const rows = buildCatalog({
    tree,
    mockTests,
    history,
    examName: 'UPSSSC PET',
  });

  it('makes one practice row per topic, carrying its lock and last attempt', () => {
    const t1 = rows.find(r => r.id === 'practice-t1');
    expect(t1).toMatchObject({
      kind: 'practice',
      title: 't1',
      subtitle: 'Practice Test • UPSSSC PET',
      locked: false,
      attempted: true,
      accuracy: 80,
    });
    const t2 = rows.find(r => r.id === 'practice-t2');
    expect(t2.locked).toBe(true); // the topic itself is locked
    const t3 = rows.find(r => r.id === 'practice-t3');
    expect(t3.locked).toBe(true); // its chapter is locked
    expect(t3.attempted).toBe(false);
  });

  it('makes one chapter row per chapter, pointing at its first topic', () => {
    const c1 = rows.find(r => r.id === 'chapter-c1');
    expect(c1).toMatchObject({
      kind: 'chapter',
      title: 'Number System – Mix Questions',
      topicId: 't1',
      tag: '2 topics',
      locked: false,
    });
    const c2 = rows.find(r => r.id === 'chapter-c2');
    expect(c2.locked).toBe(true);
  });

  it('splits mock tests into mock and subject rows; neither is a real attempt yet', () => {
    const mock1 = rows.find(r => r.id === 'mock-full-01');
    expect(mock1).toMatchObject({
      kind: 'mock',
      questions: 100,
      minutes: 60,
      tag: 'Latest Pattern',
      attempted: false,
      accuracy: null,
    });
    // Even one whose mock-service `progress` field is set (seed data for that
    // screen's own progress ring) is not counted as attempted here.
    const subj = rows.find(r => r.id === 'mock-subject-quant');
    expect(subj).toMatchObject({
      kind: 'subject',
      tag: 'Moderate',
      attempted: false,
      accuracy: null,
    });
  });

  it('drops mock-service "topic" tests, since our own practice rows already cover that', () => {
    const withTopicType = [
      ...mockTests,
      {
        id: 'topic-x',
        type: 'topic',
        name: 'Some Topic Test',
        subtitle: '',
        questions: 15,
        minutes: 15,
        difficulty: 1,
        popularity: 1,
        order: 1,
        progress: null,
      },
    ];
    const withTopic = buildCatalog({
      tree,
      mockTests: withTopicType,
      history,
      examName: 'PET',
    });
    expect(withTopic.find(r => r.id === 'mock-topic-x')).toBeUndefined();
  });
});

describe('filterCatalog / sortCatalog', () => {
  const rows = buildCatalog({ tree, mockTests, history, examName: 'PET' });

  it('filters by category', () => {
    expect(
      filterCatalog(rows, { category: 'mock' }).every(r => r.kind === 'mock'),
    ).toBe(true);
    expect(filterCatalog(rows, { category: 'chapter' })).toHaveLength(2);
  });

  it('filters by a case-insensitive search over title and subtitle', () => {
    const found = filterCatalog(rows, { query: 'full mock' });
    expect(found.map(r => r.id)).toEqual(['mock-full-01', 'mock-full-02']);
    expect(
      filterCatalog(rows, { query: 'NUMBER SYSTEM' }).length,
    ).toBeGreaterThan(0);
  });

  it('sorts A-Z and by question count, and defaults to mock-first', () => {
    const az = sortCatalog(rows, 'az');
    expect(az.map(r => r.title)).toEqual([...az.map(r => r.title)].sort());

    const byQuestions = sortCatalog(rows, 'questions');
    expect(byQuestions[0].questions).toBe(100);

    const byDefault = sortCatalog(rows, 'default');
    expect(byDefault[0].kind).toBe('mock');
    expect(byDefault[byDefault.length - 1].kind).toBe('chapter');
  });
});

describe('computeCatalogStats', () => {
  it('counts only real practice attempts, ignoring the mock service’s seed progress', () => {
    const rows = buildCatalog({ tree, mockTests, history, examName: 'PET' });
    const stats = computeCatalogStats(rows);
    // Only practice-t1 (accuracy 80) is a genuine attempt; mock-full-02 and
    // mock-subject-quant have a seeded `progress` but no real attempt behind it.
    expect(stats.attempted).toBe(1);
    expect(stats.averageScore).toBe(80);
    expect(stats.available).toBe(rows.length);
  });

  it('shows no average score when nothing is attempted', () => {
    const rows = buildCatalog({
      tree,
      mockTests: [],
      history: [],
      examName: 'PET',
    });
    expect(computeCatalogStats(rows).averageScore).toBeNull();
  });
});

describe('pickRecommended', () => {
  it('picks the most popular full test, and the newest different one', () => {
    const { popular, latest } = pickRecommended(mockTests);
    expect(popular.id).toBe('full-01');
    expect(latest.id).toBe('full-02');
  });

  it('has no latest card when the newest and the most popular are the same test', () => {
    const { popular, latest } = pickRecommended([mockTests[0]]);
    expect(popular.id).toBe('full-01');
    expect(latest).toBeNull();
  });

  it('is all null without a full-length test', () => {
    expect(pickRecommended([mockTests[2]])).toEqual({
      popular: null,
      latest: null,
    });
  });
});
