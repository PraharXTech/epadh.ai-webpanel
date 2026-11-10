import { hasFeature } from '@/features/membership/utils/entitlements';

describe('hasFeature', () => {
  it('follows the per-feature flags on a Free plan', () => {
    const entitlements = {
      plan: 'free',
      features: { omr: false, weakTopics: true },
    };
    expect(hasFeature(entitlements, 'omr')).toBe(false);
    expect(hasFeature(entitlements, 'weakTopics')).toBe(true);
    expect(hasFeature(entitlements, 'unknownFeature')).toBe(false);
  });

  it('opens everything on a Pro plan', () => {
    expect(hasFeature({ plan: 'pro', features: {} }, 'omr')).toBe(true);
  });

  it('is locked when there are no entitlements at all', () => {
    expect(hasFeature(undefined, 'omr')).toBe(false);
    expect(hasFeature({}, 'omr')).toBe(false);
  });
});
