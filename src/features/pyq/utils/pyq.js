// The feature a paper is gated behind when the admin marks it Pro (same one as advanced
// mock tests: a Pro student reads every paper).
export const PYQ_FEATURE = 'advancedMocks';

// Newest year first; within a year, Shift 1 before Shift 2.
export const sortPapers = papers =>
  [...papers].sort(
    (a, b) =>
      b.year - a.year || String(a.shift ?? '').localeCompare(String(b.shift ?? '')),
  );

// Distinct years, newest first.
export const paperYears = papers =>
  [...new Set(papers.map(p => p.year))].sort((a, b) => b - a);

// "2024 • Shift 1", or just "2023" when the paper has no shift.
export const paperLabel = paper =>
  paper.shift ? `${paper.year} • ${paper.shift}` : String(paper.year);

// "Hindi + English • 28 pages • 3.1 MB"
export const describePaper = paper =>
  [
    paper.language,
    paper.pages ? `${paper.pages} pages` : null,
    paper.sizeMb ? `${paper.sizeMb} MB` : null,
  ]
    .filter(Boolean)
    .join(' • ');

// `filter` is 'all', 'saved' or a year (as text). `query` matches the title, year and shift.
export const filterPapers = (papers, { filter, query, saved }) => {
  const needle = query.trim().toLowerCase();
  return papers.filter(p => {
    if (filter === 'saved' && !saved[p.id]) {
      return false;
    }
    if (filter !== 'all' && filter !== 'saved' && String(p.year) !== filter) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return `${p.title} ${p.year} ${p.shift ?? ''} ${p.language ?? ''}`
      .toLowerCase()
      .includes(needle);
  });
};
