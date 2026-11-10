// Free/Pro gating is decided only from the entitlements the backend returns
// (plan.md section 3). The app never hard-codes limits.
export const FEATURE_LABELS = {
  fullSyllabus: 'Full syllabus',
  advancedMocks: 'Advanced mock tests',
  studyPlanner: 'Personal study planner',
  weakTopics: 'Weak topic analysis',
  extendedPractice: 'Extended practice',
  ai: 'Ask epadh.ai',
};

export const hasFeature = (entitlements, feature) =>
  isProActive(entitlements) || Boolean(entitlements?.features?.[feature]);

// A cached entitlements object can say plan: 'pro' after the plan has actually
// expired, until the app next talks to the server (which is the only thing that
// truly enforces this). This just keeps the UI from showing Pro as unlocked in the
// meantime; it is not itself the source of truth.
export const isProActive = entitlements => {
  if (entitlements?.plan !== 'pro') {
    return false;
  }
  if (!entitlements.validTill) {
    return true;
  }
  return new Date(entitlements.validTill).getTime() > Date.now();
};

// Days left until a Pro plan expires, or null when there is nothing to count down
// (Free, or no expiry set).
export const daysUntilExpiry = entitlements => {
  if (entitlements?.plan !== 'pro' || !entitlements.validTill) {
    return null;
  }
  const ms = new Date(entitlements.validTill).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};
