const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// The message "Ask epadh.ai" sends for a question picked from a result screen: the
// question, its options, what the student chose and the right answer, so the tutor
// can explain without any other context.
export const buildQuestionPrompt = item => {
  const options = item.options
    .map((option, i) => `${LETTERS[i]}. ${option}`)
    .join('\n');
  const chosen =
    item.chosen === null || item.chosen === undefined
      ? 'I skipped this question.'
      : `I chose ${LETTERS[item.chosen]}.`;
  return `Explain this question in simple words:\n\n${item.text}\n${options}\n\n${chosen} Correct answer: ${
    LETTERS[item.answer]
  }.`;
};
