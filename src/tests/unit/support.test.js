import { FAQS } from '@/features/support/content/faqs';
import {
  buildMailto,
  buildSupportBody,
  faqCategories,
  filterFaqs,
} from '@/features/support/utils/support';
import { PRIVACY } from '@/features/legal/content/privacy';
import { TERMS } from '@/features/legal/content/terms';

describe('FAQ search', () => {
  it('an empty search keeps everything', () => {
    expect(filterFaqs(FAQS, '')).toHaveLength(FAQS.length);
    expect(filterFaqs(FAQS, '   ')).toHaveLength(FAQS.length);
  });

  it('matches words in the question or the answer, in any order and case', () => {
    expect(filterFaqs(FAQS, 'REFUND').map(f => f.id)).toContain('refund');
    expect(filterFaqs(FAQS, 'deducted pro').map(f => f.id)).toEqual(['pay-failed']);
  });

  it('every word must match', () => {
    expect(filterFaqs(FAQS, 'refund zzzzqqq')).toEqual([]);
  });

  it('has unique ids and every action points at a real screen name', () => {
    const ids = FAQS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const screens = ['EditProfile', 'History', 'Membership', 'PaymentHistory', 'Terms', 'DeleteAccount'];
    FAQS.filter(f => f.action).forEach(f =>
      expect(screens).toContain(f.action.name),
    );
    expect(faqCategories(FAQS).length).toBeGreaterThan(3);
  });
});

describe('support email', () => {
  it('builds a mailto link with the subject and body encoded', () => {
    const url = buildMailto({ email: 'a@b.co', subject: 'Hi & bye', body: 'x y' });
    expect(url).toBe('mailto:a@b.co?subject=Hi%20%26%20bye&body=x%20y');
  });

  it('adds the app and phone details under the message', () => {
    const body = buildSupportBody({
      lead: 'It broke',
      version: '1.2.3',
      platform: 'Android',
      osVersion: '14',
      userName: 'Asha',
      mobile: null,
    });
    expect(body).toContain('It broke');
    expect(body).toContain('App version: 1.2.3');
    expect(body).toContain('Phone: Android 14');
    expect(body).toContain('Name: Asha');
    expect(body).not.toContain('Mobile:');
  });
});

describe('legal content', () => {
  it.each([
    ['terms', TERMS],
    ['privacy', PRIVACY],
  ])('%s has an intro and complete, unique sections', (_, doc) => {
    expect(doc.intro.length).toBeGreaterThan(40);
    expect(doc.sections.length).toBeGreaterThan(5);
    const headings = doc.sections.map(s => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
    doc.sections.forEach(s =>
      expect((s.paragraphs?.length ?? 0) + (s.bullets?.length ?? 0)).toBeGreaterThan(0),
    );
  });
});
