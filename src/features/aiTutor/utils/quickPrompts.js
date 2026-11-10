// Interactive prompt chips shown under the last AI message and on the empty state
// (plan.md §11). `id` maps to a canned reply in aiTutorService until the real AI
// question-generation and quiz endpoints exist (Phase 6).
export const QUICK_PROMPTS = [
  { id: 'simpler', text: 'और आसान भाषा में समझाओ' },
  { id: 'questions', text: 'इससे 10 सवाल बनाओ' },
  { id: 'quiz', text: 'मेरा टेस्ट लो' },
  { id: 'keypoints', text: 'मुख्य परीक्षा बिंदु बताओ' },
];
