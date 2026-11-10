// Mock question bank. Real endpoint: GET /topics/:id/questions?count=N (admin-managed
// question bank). Correct answers and explanations come with the questions here so the
// app can grade offline; the real API may grade on the server instead.
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';
import { generateMockPaper } from '@/features/mock/utils/questionGenerator';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// subject -> topic -> [question, options, index of the correct option, explanation]
const BANK = {
  quant: {
    't-number-types': [
      [
        'Which of these is a prime number?',
        ['51', '57', '61', '91'],
        2,
        '51 = 3×17, 57 = 3×19 and 91 = 7×13, so only 61 has no factor other than 1 and itself.',
      ],
      [
        'The smallest composite number is',
        ['1', '2', '4', '6'],
        2,
        '1 is neither prime nor composite, 2 is prime, so 4 is the first composite number.',
      ],
      [
        'How many prime numbers are there between 1 and 20?',
        ['6', '7', '8', '9'],
        2,
        'The primes are 2, 3, 5, 7, 11, 13, 17 and 19: eight in all.',
      ],
    ],
    't-hcf-lcm': [
      [
        'The HCF of 12 and 18 is',
        ['2', '3', '6', '9'],
        2,
        '12 = 2²×3 and 18 = 2×3². The HCF takes the lowest powers: 2×3 = 6.',
      ],
      [
        'The LCM of 4, 6 and 8 is',
        ['12', '24', '32', '48'],
        1,
        'Take the highest powers of each prime: 2³×3 = 24.',
      ],
      [
        'The product of two numbers is 216 and their HCF is 6. Their LCM is',
        ['18', '36', '72', '216'],
        1,
        'HCF × LCM = product of the numbers, so LCM = 216 ÷ 6 = 36.',
      ],
    ],
    't-divisibility': [
      [
        'A number is divisible by 9 when',
        [
          'its last digit is 9',
          'the sum of its digits is divisible by 9',
          'it is odd',
          'its last two digits are divisible by 9',
        ],
        1,
        'The digit-sum rule: a number is divisible by 9 exactly when its digits add up to a multiple of 9.',
      ],
      [
        'Which number is divisible by 11?',
        ['1234', '2728', '3125', '4567'],
        1,
        'For 2728: (2 + 2) − (7 + 8) = −11, which is a multiple of 11.',
      ],
      [
        'What is the smallest digit that replaces * so that 47*2 is divisible by 3?',
        ['0', '1', '2', '3'],
        2,
        'The digit sum 4 + 7 + * + 2 = 13 + *. The smallest multiple of 3 that is at least 13 is 15, so * = 2.',
      ],
    ],
    't-percentage': [
      [
        '25% of 480 is',
        ['96', '110', '120', '150'],
        2,
        '480 × 25 ÷ 100 = 120.',
      ],
      [
        'A number is increased by 20% and then decreased by 20%. The net change is',
        ['no change', '4% decrease', '4% increase', '2% decrease'],
        1,
        '1.2 × 0.8 = 0.96, so the number is 4% lower.',
      ],
      [
        'What percent of 250 is 40?',
        ['12%', '14%', '16%', '18%'],
        2,
        '40 ÷ 250 × 100 = 16%.',
      ],
    ],
    't-profit-loss': [
      [
        'An article bought for ₹400 is sold for ₹460. The profit percent is',
        ['12%', '15%', '18%', '20%'],
        1,
        'Profit = 60, and 60 ÷ 400 × 100 = 15%.',
      ],
      [
        'By selling an item for ₹720 a shopkeeper loses 10%. Its cost price is',
        ['₹780', '₹800', '₹820', '₹900'],
        1,
        'SP = 90% of CP, so CP = 720 ÷ 0.9 = ₹800.',
      ],
      [
        'A trader sells at a 20% discount on the marked price ₹500. The selling price is',
        ['₹380', '₹400', '₹420', '₹450'],
        1,
        '20% of 500 is 100, so the selling price is ₹400.',
      ],
    ],
    't-ratio': [
      [
        'Divide ₹900 in the ratio 2 : 3 : 4. The largest share is',
        ['₹300', '₹350', '₹400', '₹450'],
        2,
        'One part = 900 ÷ 9 = 100, so the largest share is 4 × 100 = ₹400.',
      ],
      [
        'If A : B = 3 : 4 and B : C = 8 : 9, then A : C is',
        ['2 : 3', '3 : 4', '1 : 2', '4 : 5'],
        0,
        'Make B equal: A : B = 6 : 8 and B : C = 8 : 9, so A : C = 6 : 9 = 2 : 3.',
      ],
      [
        'The ratio of the ages of two people is 5 : 7 and the sum of their ages is 60. The elder is',
        ['25', '30', '35', '40'],
        2,
        'One part = 60 ÷ 12 = 5, so the elder is 7 × 5 = 35.',
      ],
    ],
    't-time-work': [
      [
        'A can do a job in 12 days and B in 24 days. Working together they finish it in',
        ['6 days', '8 days', '10 days', '18 days'],
        1,
        'Their one-day work is 1/12 + 1/24 = 3/24 = 1/8, so 8 days.',
      ],
      [
        '6 men complete a job in 10 days. How many days will 15 men take?',
        ['2 days', '4 days', '6 days', '25 days'],
        1,
        'Total work = 6 × 10 = 60 man-days, and 60 ÷ 15 = 4 days.',
      ],
      [
        'A pipe fills a tank in 6 hours and another empties it in 12 hours. Both are open. The tank fills in',
        ['8 hours', '10 hours', '12 hours', '18 hours'],
        2,
        '1/6 − 1/12 = 1/12 per hour, so 12 hours.',
      ],
    ],
    't-interest': [
      [
        'The simple interest on ₹2000 at 5% per annum for 3 years is',
        ['₹200', '₹300', '₹400', '₹500'],
        1,
        'SI = 2000 × 5 × 3 ÷ 100 = ₹300.',
      ],
      [
        'The compound interest on ₹1000 at 10% per annum for 2 years is',
        ['₹200', '₹205', '₹210', '₹220'],
        2,
        'Amount = 1000 × 1.1² = 1210, so the interest is ₹210.',
      ],
      [
        'A sum doubles itself in 10 years at simple interest. The rate per annum is',
        ['5%', '8%', '10%', '12%'],
        2,
        'Interest equals the principal in 10 years, so the rate is 100 ÷ 10 = 10%.',
      ],
    ],
  },
  gk: {
    't-geography': [
      [
        'Which is the longest river that flows entirely within India?',
        ['Yamuna', 'Ganga', 'Godavari', 'Krishna'],
        1,
        'The Ganga (about 2,525 km) is the longest river of India; the Indus and Brahmaputra begin outside the country.',
      ],
      [
        'The Tropic of Cancer does NOT pass through which state?',
        ['Gujarat', 'Rajasthan', 'Odisha', 'Chhattisgarh'],
        2,
        'It passes through eight states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram.',
      ],
      [
        'Which is the highest peak in India?',
        ['Nanda Devi', 'Kangchenjunga', 'K2', 'Kamet'],
        1,
        'Kangchenjunga (8,586 m) is the highest peak within India. K2 lies in the part of Kashmir that India does not administer.',
      ],
    ],
    't-polity': [
      [
        'Who is known as the Father of the Indian Constitution?',
        [
          'Mahatma Gandhi',
          'B. R. Ambedkar',
          'Jawaharlal Nehru',
          'Sardar Patel',
        ],
        1,
        'Dr B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly.',
      ],
      [
        'The Fundamental Rights are in which Part of the Constitution?',
        ['Part II', 'Part III', 'Part IV', 'Part V'],
        1,
        'Part III (Articles 12 to 35) contains the Fundamental Rights.',
      ],
      [
        'The minimum age to become a member of the Lok Sabha is',
        ['18 years', '21 years', '25 years', '30 years'],
        2,
        'Article 84 sets 25 years for the Lok Sabha and 30 years for the Rajya Sabha.',
      ],
    ],
    't-monthly': [
      [
        'The Reserve Bank of India was established in',
        ['1925', '1935', '1947', '1950'],
        1,
        'The RBI began operating on 1 April 1935 under the RBI Act, 1934.',
      ],
      [
        'GST was launched in India on',
        ['1 April 2016', '1 July 2017', '1 January 2018', '1 April 2019'],
        1,
        'The Goods and Services Tax came into force on 1 July 2017.',
      ],
      [
        'The headquarters of UNESCO is in',
        ['New York', 'Geneva', 'Paris', 'Vienna'],
        2,
        'UNESCO is headquartered in Paris, France.',
      ],
    ],
    't-awards': [
      [
        'The Bharat Ratna is awarded for',
        [
          'bravery in war',
          'the highest civilian service of any field',
          'sports excellence only',
          'literature only',
        ],
        1,
        'It is the highest civilian award, given for exceptional service in any field of human endeavour.',
      ],
      [
        'The Arjuna Award is given in the field of',
        ['Literature', 'Sports', 'Science', 'Cinema'],
        1,
        'The Arjuna Award recognises outstanding achievement in sports.',
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
        'The Swedish Academy in Stockholm selects the Nobel laureate in Literature.',
      ],
    ],
  },
  reasoning: {
    't-blood': [
      [
        'Pointing to a man, Riya says, "He is the son of my mother\'s only brother." How is the man related to Riya?',
        ['Brother', 'Cousin', 'Uncle', 'Nephew'],
        1,
        "Her mother's brother's son is her maternal cousin.",
      ],
      [
        "A is B's sister. C is B's mother. D is C's father. How is A related to D?",
        ['Grandmother', 'Granddaughter', 'Daughter', 'Aunt'],
        1,
        "D is C's father and A is C's daughter, so A is D's granddaughter.",
      ],
      [
        'If P is the brother of Q and Q is the sister of R, how is P related to R?',
        ['Brother', 'Sister', 'Cannot be determined', 'Cousin'],
        0,
        "P is the brother of Q, and Q and R are siblings, so P is a sibling of R. P is male, so P is R's brother.",
      ],
    ],
    't-coding': [
      [
        'If CAT is coded as DBU, then DOG is coded as',
        ['EPH', 'EPG', 'DPH', 'FQI'],
        0,
        'Each letter moves one step forward: D→E, O→P, G→H.',
      ],
      [
        'If A = 1, B = 2 and so on, the value of the word BAD is',
        ['5', '6', '7', '8'],
        2,
        'B + A + D = 2 + 1 + 4 = 7.',
      ],
      [
        'In a code, 2 = 4, 3 = 9 and 4 = 16. Then 6 = ?',
        ['12', '24', '36', '48'],
        2,
        'Each number is squared: 6² = 36.',
      ],
    ],
    't-series': [
      [
        'Find the next term: 2, 6, 12, 20, 30, ?',
        ['38', '40', '42', '44'],
        2,
        'The differences are 4, 6, 8, 10, 12, so the next term is 30 + 12 = 42.',
      ],
      [
        'Find the next term: 3, 6, 12, 24, ?',
        ['30', '36', '48', '60'],
        2,
        'Each term is double the previous one.',
      ],
      [
        'Find the next letter: A, C, F, J, ?',
        ['M', 'N', 'O', 'P'],
        2,
        'The gaps grow by one each time: +2, +3, +4, so J + 5 = O.',
      ],
    ],
    't-mirror': [
      [
        'In a mirror, the time on a clock looks like 3:00. The actual time is',
        ['3:00', '6:00', '9:00', '12:00'],
        2,
        'The mirror image of a clock reads 12 minus the shown time: 12:00 − 3:00 = 9:00.',
      ],
      [
        'A mirror is placed to the right of the letter "b". Its image looks like',
        ['b', 'd', 'p', 'q'],
        1,
        'A mirror on the right flips left and right, so "b" appears as "d".',
      ],
      [
        'What is the mirror image of the word "MOM" placed against a vertical mirror?',
        ['WOW', 'MOM', 'NON', 'MOW'],
        1,
        'M and O are symmetric about a vertical axis, so MOM looks the same.',
      ],
    ],
    't-cubes': [
      [
        'How many faces does a cube have?',
        ['4', '6', '8', '12'],
        1,
        'A cube has 6 faces, 12 edges and 8 vertices.',
      ],
      [
        'On a standard die, the face opposite 2 is',
        ['3', '4', '5', '6'],
        2,
        'Opposite faces add up to 7, so the face opposite 2 shows 5.',
      ],
      [
        'A 3×3×3 cube is painted on all faces and cut into 27 small cubes. How many have exactly 3 faces painted?',
        ['4', '6', '8', '12'],
        2,
        'Only the 8 corner cubes have three painted faces.',
      ],
    ],
  },
};

// Flat list with stable ids, tagged with the subject and topic they belong to.
const QUESTIONS = Object.entries(BANK).flatMap(([subjectId, topics]) =>
  Object.entries(topics).flatMap(([topicId, rows]) =>
    rows.map(([text, options, answer, explanation], i) => ({
      id: `${topicId}-${i + 1}`,
      subjectId,
      topicId,
      text,
      options,
      answer,
      explanation,
    })),
  ),
);

// Fisher–Yates on a copy, so a retry does not always show the same order.
const shuffle = list => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// Questions of the topic first; when the topic has fewer than `count`, the set is
// topped up from the same subject so a test can still be the length the student picked.
export const fetchQuestions = async ({ topicId, subjectId, count }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.get(`/topics/${topicId}/questions`, {
      params: { count },
    });
    return data;
  }
  await delay();
  const own = shuffle(QUESTIONS.filter(q => q.topicId === topicId));
  const rest = shuffle(
    QUESTIONS.filter(q => q.subjectId === subjectId && q.topicId !== topicId),
  );
  return [...own, ...rest].slice(0, count);
};

// AI-generated set. Real endpoint: POST /ai/questions { topicId, count, difficulty }
// returns a normal question set (plan.md §5.10). The mock builds fresh questions from
// the mock-test generator; the `ai` flag is what the badge and the report action key on.
export const fetchAiQuestions = async ({ topicId, subjectId, count }) => {
  if (!USE_MOCK_API) {
    const { data } = await apiClient.post('/ai/questions', {
      topicId,
      count,
    });
    return data.map(q => ({ ...q, ai: true }));
  }
  await delay(900);
  const subject = ['quant', 'reasoning', 'gk'].includes(subjectId)
    ? subjectId
    : 'quant';
  return generateMockPaper({ subjects: [subject], count }).map(q => ({
    ...q,
    topicId,
    ai: true,
  }));
};

// Report a wrong or unclear question. Real endpoint: POST /questions/:id/report.
export const reportQuestion = async ({ questionId, reason }) => {
  if (!USE_MOCK_API) {
    await apiClient.post(`/questions/${questionId}/report`, { reason });
    return;
  }
  await delay(300);
};
