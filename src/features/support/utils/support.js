export const buildMailto = ({ email, subject, body }) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}${
    body ? `&body=${encodeURIComponent(body)}` : ''
  }`;

// What support needs to look into a problem, added under the student's own message.
export const buildSupportBody = ({ lead = '', version, platform, osVersion, userName, mobile }) =>
  [
    lead,
    '',
    '',
    '---- Please keep the lines below ----',
    `App version: ${version}`,
    `Phone: ${platform} ${osVersion}`,
    userName ? `Name: ${userName}` : null,
    mobile ? `Mobile: ${mobile}` : null,
  ]
    .filter(line => line !== null)
    .join('\n');

// Questions whose question or answer contains every word typed. An empty search keeps
// everything. Pure, so the Help screen and the tests share it.
export const filterFaqs = (faqs, query) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return faqs;
  }
  return faqs.filter(f => {
    const text = `${f.question} ${f.answer}`.toLowerCase();
    return words.every(w => text.includes(w));
  });
};

export const faqCategories = faqs => [...new Set(faqs.map(f => f.category))];
