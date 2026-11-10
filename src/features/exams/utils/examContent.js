// Content (syllabus, study material) is loaded per exam. A student can prepare for
// several exams, so what they see is the union of their exams' content: a subject,
// chapter, topic or item that appears in more than one exam shows up once, and
// `examIds` says which of the student's exams it belongs to (the exam filter chips
// use it). Order is kept: exams in the order chosen, content in the order served.

const addExam = (node, examId) => {
  if (!node.examIds.includes(examId)) {
    node.examIds.push(examId);
  }
};

// `entries` = [{ examId, subjects }] where subjects is Subject -> chapters -> topics.
export const mergeSyllabus = entries => {
  const subjects = new Map();
  entries.forEach(({ examId, subjects: list }) => {
    list.forEach(subject => {
      let s = subjects.get(subject.id);
      if (!s) {
        s = { ...subject, examIds: [], chapterMap: new Map() };
        subjects.set(subject.id, s);
      }
      addExam(s, examId);
      subject.chapters.forEach(chapter => {
        let c = s.chapterMap.get(chapter.id);
        if (!c) {
          c = { ...chapter, examIds: [], topicMap: new Map() };
          s.chapterMap.set(chapter.id, c);
        }
        addExam(c, examId);
        chapter.topics.forEach(topic => {
          let t = c.topicMap.get(topic.id);
          if (!t) {
            t = { ...topic, examIds: [] };
            c.topicMap.set(topic.id, t);
          }
          addExam(t, examId);
        });
      });
    });
  });

  return [...subjects.values()].map(({ chapterMap, ...subject }) => ({
    ...subject,
    chapters: [...chapterMap.values()].map(({ topicMap, ...chapter }) => ({
      ...chapter,
      topics: [...topicMap.values()],
    })),
  }));
};

const unionById = (lists, pick) => {
  const nodes = new Map();
  lists.forEach(({ examId, ...data }) => {
    pick(data).forEach(node => {
      let n = nodes.get(node.id);
      if (!n) {
        n = { ...node, examIds: [] };
        nodes.set(node.id, n);
      }
      addExam(n, examId);
    });
  });
  return [...nodes.values()];
};

// `entries` = [{ examId, subjects, items }] -> { subjects, items }, each tagged with examIds.
export const mergeMaterial = entries => ({
  subjects: unionById(entries, data => data.subjects),
  items: unionById(entries, data => data.items),
});

// The same tree restricted to one exam (nodes with no content left are dropped).
export const forExam = (nodes, examId) =>
  nodes.filter(node => node.examIds.includes(examId));

// One status for the screen out of the per-exam ones: still loading if any selected exam
// is, failed if any failed, succeeded once every one is in, idle before anything started.
export const aggregateStatus = (statuses, examIds) => {
  const list = examIds.map(id => statuses[id] ?? 'idle');
  if (list.includes('loading')) {
    return 'loading';
  }
  if (list.includes('failed')) {
    return 'failed';
  }
  return list.length > 0 && list.every(s => s === 'succeeded')
    ? 'succeeded'
    : 'idle';
};

// The first error among the selected exams, or null.
export const firstError = (errors, examIds) =>
  examIds.map(id => errors[id]).find(Boolean) ?? null;
