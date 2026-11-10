// Mock question bank for mock tests. Real endpoint: the paper (with its answer key)
// comes from the admin-managed question bank (plan.md §5.11); until then this
// generates a fresh, plausible paper per attempt so a mock test has real questions
// to answer instead of just its list-screen metadata.
const SUBJECT_NAMES = {
  quant: 'Quantitative Aptitude',
  reasoning: 'Reasoning',
  gk: 'General Awareness',
};

const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const shuffle = list => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const shuffleWithAnswer = (correct, wrongs) => {
  const options = shuffle([correct, ...wrongs]);
  return { options: options.map(String), answer: options.indexOf(correct) };
};

// `count` distinct numeric wrong options near `correct` (never negative or equal to it).
const wrongNumbers = (correct, count, spread) => {
  const seen = new Set([correct]);
  const wrongs = [];
  while (wrongs.length < count) {
    const delta = rand(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = correct + delta;
    if (candidate > 0 && !seen.has(candidate)) {
      seen.add(candidate);
      wrongs.push(candidate);
    }
  }
  return wrongs;
};

const QUANT_TEMPLATES = [
  () => {
    const a = rand(50, 400);
    const b = rand(20, 300);
    const correct = a + b;
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, 20),
    );
    return {
      text: `What is ${a} + ${b}?`,
      options,
      answer,
      explanation: `${a} + ${b} = ${correct}.`,
    };
  },
  () => {
    const a = rand(200, 900);
    const b = rand(20, 180);
    const correct = a - b;
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, 20),
    );
    return {
      text: `What is ${a} − ${b}?`,
      options,
      answer,
      explanation: `${a} − ${b} = ${correct}.`,
    };
  },
  () => {
    const a = rand(6, 25);
    const b = rand(6, 25);
    const correct = a * b;
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, Math.max(10, Math.round(correct * 0.15))),
    );
    return {
      text: `What is ${a} × ${b}?`,
      options,
      answer,
      explanation: `${a} × ${b} = ${correct}.`,
    };
  },
  () => {
    const pct = [10, 15, 20, 25, 40, 50][rand(0, 5)];
    const base = rand(4, 40) * 10;
    const correct = Math.round((pct / 100) * base);
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, Math.max(5, Math.round(correct * 0.2))),
    );
    return {
      text: `${pct}% of ${base} is`,
      options,
      answer,
      explanation: `${base} × ${pct} ÷ 100 = ${correct}.`,
    };
  },
  () => {
    const avg = rand(15, 80);
    const d1 = rand(-10, 10);
    const d2 = rand(-10, 10);
    const a = avg + d1;
    const b = avg + d2;
    const c = avg - d1 - d2;
    const { options, answer } = shuffleWithAnswer(avg, wrongNumbers(avg, 3, 8));
    return {
      text: `The average of ${a}, ${b} and ${c} is`,
      options,
      answer,
      explanation: `(${a} + ${b} + ${c}) ÷ 3 = ${avg}.`,
    };
  },
  () => {
    const p = rand(2, 20) * 500;
    const r = [5, 6, 8, 10, 12][rand(0, 4)];
    const t = rand(2, 5);
    const correct = Math.round((p * r * t) / 100);
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, Math.max(20, Math.round(correct * 0.15))),
    );
    return {
      text: `Simple interest on ₹${p} at ${r}% per annum for ${t} years is`,
      options,
      answer,
      explanation: `SI = ${p} × ${r} × ${t} ÷ 100 = ₹${correct}.`,
    };
  },
];

const REASONING_TEMPLATES = [
  () => {
    const start = rand(2, 20);
    const diff = rand(2, 8);
    const terms = [0, 1, 2, 3].map(i => start + i * diff);
    const correct = start + 4 * diff;
    const { options, answer } = shuffleWithAnswer(
      correct,
      wrongNumbers(correct, 3, diff + 3),
    );
    return {
      text: `Find the next term: ${terms.join(', ')}, ?`,
      options,
      answer,
      explanation: `Each term increases by ${diff}, so the next term is ${terms[3]} + ${diff} = ${correct}.`,
    };
  },
  () => {
    const words = [
      'CAT',
      'DOG',
      'SUN',
      'MAP',
      'BUS',
      'PEN',
      'BOX',
      'FAN',
      'KEY',
      'RUN',
    ];
    const codeWord = (w, s) =>
      w
        .split('')
        .map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + s) % 26) + 65))
        .join('');
    const shift = rand(1, 5);
    const source = words[rand(0, words.length - 1)];
    const target = words[rand(0, words.length - 1)];
    const sourceCoded = codeWord(source, shift);
    const correct = codeWord(target, shift);
    const wrongs = new Set();
    for (let s = 1; s <= 5 && wrongs.size < 3; s += 1) {
      if (s !== shift) {
        const candidate = codeWord(target, s);
        if (candidate !== correct) {
          wrongs.add(candidate);
        }
      }
    }
    const { options, answer } = shuffleWithAnswer(correct, [...wrongs]);
    return {
      text: `If ${source} is coded as ${sourceCoded}, then ${target} is coded as`,
      options,
      answer,
      explanation: `Each letter moves ${shift} step${shift > 1 ? 's' : ''} forward in the alphabet, so ${target} → ${correct}.`,
    };
  },
];

// Curated GK facts (procedural generation doesn't work for trivia). Real content
// comes from the admin-managed bank once the backend exists.
// [question, options, index of the correct option, explanation] — same tuple shape
// as practice/services/practiceService.js's own question bank.
const GK_FACTS = [
  [
    'Which is the longest river that flows entirely within India?',
    ['Yamuna', 'Ganga', 'Godavari', 'Krishna'],
    1,
    'The Ganga is the longest river flowing entirely within India.',
  ],
  [
    'The Reserve Bank of India was established in',
    ['1925', '1935', '1947', '1950'],
    1,
    'The Reserve Bank of India began operating on 1 April 1935.',
  ],
  [
    'Who is known as the Father of the Indian Constitution?',
    ['Mahatma Gandhi', 'B. R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Patel'],
    1,
    'Dr B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly.',
  ],
  [
    'GST was launched in India on',
    ['1 April 2016', '1 July 2017', '1 January 2018', '1 April 2019'],
    1,
    'GST came into force in India on 1 July 2017.',
  ],
  [
    'Which is the highest peak in India?',
    ['Nanda Devi', 'Kangchenjunga', 'K2', 'Kamet'],
    1,
    'Kangchenjunga (8,586 m) is the highest peak within India.',
  ],
  [
    'The Fundamental Rights are in which Part of the Constitution?',
    ['Part II', 'Part III', 'Part IV', 'Part V'],
    1,
    'Part III (Articles 12-35) has the Fundamental Rights.',
  ],
  [
    'The headquarters of UNESCO is in',
    ['New York', 'Geneva', 'Paris', 'Vienna'],
    2,
    'UNESCO is headquartered in Paris, France.',
  ],
  [
    'The Bharat Ratna is awarded for',
    [
      'bravery in war',
      'the highest civilian service of any field',
      'sports excellence only',
      'literature only',
    ],
    1,
    'The Bharat Ratna is the highest civilian award of India.',
  ],
  [
    'The minimum age to become a member of the Lok Sabha is',
    ['18 years', '21 years', '25 years', '30 years'],
    2,
    'Article 84 sets 25 years as the minimum age for the Lok Sabha.',
  ],
  [
    'The Nobel Prize in Literature is awarded by',
    [
      'the Swedish Academy',
      'the UN General Assembly',
      'UNESCO',
      'the Royal Society',
    ],
    0,
    'The Swedish Academy selects the Nobel laureate in Literature.',
  ],
  [
    'The Tropic of Cancer does NOT pass through which state?',
    ['Gujarat', 'Rajasthan', 'Odisha', 'Chhattisgarh'],
    2,
    'The Tropic of Cancer passes through eight Indian states, not Odisha.',
  ],
  [
    'The Indian Constitution was adopted on',
    ['15 August 1947', '26 January 1950', '26 November 1949', '2 October 1950'],
    2,
    'The Constitution was adopted on 26 November 1949, and came into force on 26 January 1950.',
  ],
  [
    'Who wrote the Indian national anthem?',
    [
      'Bankim Chandra Chattopadhyay',
      'Rabindranath Tagore',
      'Sarojini Naidu',
      'Subhas Chandra Bose',
    ],
    1,
    'Rabindranath Tagore wrote Jana Gana Mana, the Indian national anthem.',
  ],
  [
    'The upper house of the Indian Parliament is called the',
    ['Lok Sabha', 'Rajya Sabha', 'Vidhan Sabha', 'Vidhan Parishad'],
    1,
    'The Rajya Sabha is the upper house of the Indian Parliament.',
  ],
  [
    'The Indian Space Research Organisation (ISRO) was established in',
    ['1962', '1969', '1975', '1980'],
    1,
    'ISRO was established in 1969.',
  ],
  [
    'The Sun rises first (among Indian states) in',
    ['Assam', 'Arunachal Pradesh', 'West Bengal', 'Sikkim'],
    1,
    'The Sun rises first in Arunachal Pradesh among Indian states.',
  ],
  [
    'The Thar Desert is located mainly in which state?',
    ['Gujarat', 'Rajasthan', 'Haryana', 'Punjab'],
    1,
    'The Thar Desert lies mainly in Rajasthan.',
  ],
  [
    'Who was the first President of India?',
    [
      'Jawaharlal Nehru',
      'Dr Rajendra Prasad',
      'Dr S. Radhakrishnan',
      'Zakir Husain',
    ],
    1,
    'Dr Rajendra Prasad was the first President of India.',
  ],
  [
    'The largest freshwater lake in India is',
    ['Chilika Lake', 'Dal Lake', 'Wular Lake', 'Sambhar Lake'],
    2,
    'The Wular Lake is the largest freshwater lake in India.',
  ],
  [
    'The Right to Life is guaranteed under which Article?',
    ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
    1,
    'Article 21 of the Constitution guarantees the Right to Life.',
  ],
  [
    'The Panama Canal connects which two oceans?',
    [
      'Atlantic and Indian',
      'Pacific and Indian',
      'Atlantic and Pacific',
      'Arctic and Pacific',
    ],
    2,
    'The Panama Canal connects the Atlantic and Pacific Oceans.',
  ],
  [
    'The Chief Election Commissioner of India is appointed by',
    [
      'the Parliament',
      'the Prime Minister',
      'the President',
      'the Supreme Court',
    ],
    2,
    'The Chief Election Commissioner is appointed by the President of India.',
  ],
];

const gkTemplate =
  ([text, options, answerIndex, explanation]) =>
  () => {
    const correct = options[answerIndex];
    const wrongs = options.filter((_, i) => i !== answerIndex);
    const shuffled = shuffleWithAnswer(correct, wrongs);
    return { text, ...shuffled, explanation };
  };

const GK_TEMPLATES = GK_FACTS.map(gkTemplate);

const TEMPLATES = {
  quant: QUANT_TEMPLATES,
  reasoning: REASONING_TEMPLATES,
  gk: GK_TEMPLATES,
};

let counter = 0;
const newId = () => {
  counter += 1;
  return `mq-${Date.now().toString(36)}-${counter}`;
};

// `count` questions for one subject. GK draws without repeats until its (small)
// pool runs out, then starts again — the other subjects generate fresh each time.
const questionsForSubject = (subjectId, count) => {
  const templates = shuffle(TEMPLATES[subjectId]);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    out.push({
      id: newId(),
      subjectId,
      subjectName: SUBJECT_NAMES[subjectId],
      ...template(),
    });
  }
  return out;
};

// One full paper for a mock test: `count` questions split evenly across `subjects`,
// each subject's block kept together (a real exam's section layout).
export const generateMockPaper = ({ subjects, count }) => {
  const per = Math.floor(count / subjects.length);
  let remainder = count - per * subjects.length;
  return subjects.flatMap(subjectId => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return questionsForSubject(subjectId, per + extra);
  });
};
