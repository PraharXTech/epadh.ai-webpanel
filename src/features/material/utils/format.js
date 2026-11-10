export const TYPE_FILTERS = [
  { id: 'all', label: 'All', icon: 'book-open', color: '#2563eb' },
  { id: 'notes', label: 'Notes', icon: 'file-text', color: '#dc2626' },
  { id: 'video', label: 'Videos', icon: 'play', color: '#7c3aed' },
  { id: 'pyq', label: 'PYQs', icon: 'clipboard-list', color: '#059669' },
];

export const isVideo = item => item.type === 'video';
export const isHtml = item => item.format === 'html';

// Practice question sets live under the Notes filter.
export const matchesType = (item, type) =>
  type === 'all' ||
  item.type === type ||
  (type === 'notes' && item.type === 'practice');

const formatDuration = minutes =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} hr${
        minutes % 60 ? ` ${minutes % 60} min` : ''
      }`
    : `${minutes} min`;

// e.g. "PDF • 3.2 MB • 45 Pages", "Video • 42 min", "Practice Questions • 50 Qs"
export const describeItem = item => {
  switch (item.type) {
    case 'video':
      return ['Video', formatDuration(item.durationMin)].join(' • ');
    case 'practice':
      return ['Practice Questions', `${item.questions} Qs`].join(' • ');
    default: // notes, pyq
      return [
        item.format === 'html' ? 'Article' : 'PDF',
        item.dateLabel,
        item.sizeMb ? `${item.sizeMb} MB` : null,
        item.pages ? `${item.pages} Pages` : null,
      ]
        .filter(Boolean)
        .join(' • ');
  }
};
