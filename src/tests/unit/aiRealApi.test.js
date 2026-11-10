import { apiClient } from '@/api/client';
import { analyzeDoubtPhoto } from '@/features/aiTutor/services/doubtService';
import {
  AI_QUOTA_MESSAGE,
  sendMessage,
} from '@/features/aiTutor/services/aiTutorService';
import { rememberImage } from '@/services/media/imageRegistry';

// The two AI services have a mock branch (used now) and a real branch (used once the backend
// exists). These tests switch the mock off and check the real branch: what it sends, and how
// a server "too many requests" (HTTP 429) becomes the quota message the chat page recognises.
const env = vi.hoisted(() => ({ USE_MOCK_API: false }));
vi.mock('@/config/env', async importOriginal => ({
  ...(await importOriginal()),
  get USE_MOCK_API() {
    return env.USE_MOCK_API;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const tooMany = () =>
  Object.assign(new Error('Request failed'), { response: { status: 429 } });

describe('text chat, real API', () => {
  const args = {
    conversationId: 'c1',
    examId: 'pet',
    topicId: 't1',
    text: 'sawal',
  };

  it('posts the question and returns the answer', async () => {
    const reply = { id: 'm1', role: 'ai', text: 'jawab', createdAt: 1 };
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: reply });
    await expect(sendMessage(args)).resolves.toEqual(reply);
    expect(post).toHaveBeenCalledWith('/ai/chat', {
      conversationId: 'c1',
      examId: 'pet',
      topicId: 't1',
      text: 'sawal',
    });
  });

  it('a 429 becomes the quota message', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(tooMany());
    await expect(sendMessage(args)).rejects.toThrow(AI_QUOTA_MESSAGE);
  });

  it('any other failure is passed on unchanged', async () => {
    const failure = Object.assign(new Error('boom'), {
      response: { status: 500 },
    });
    vi.spyOn(apiClient, 'post').mockRejectedValue(failure);
    await expect(sendMessage(args)).rejects.toBe(failure);
  });
});

describe('photo doubt, real API', () => {
  const base = {
    note: 'ye step',
    examId: 'pet',
    topicId: 't1',
    topicName: 'Ratio',
  };

  it('uploads the FULL photo remembered for the thumbnail, as multipart form data', async () => {
    const full = new Blob(['full-size'], { type: 'image/jpeg' });
    rememberImage('data:thumb', full);
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { id: 'm', role: 'ai', text: 'ok', createdAt: 1 },
    });

    await analyzeDoubtPhoto({ imageUri: 'data:thumb', ...base });

    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe('/ai/doubt/photo');
    expect(form).toBeInstanceOf(FormData);
    const image = form.get('image');
    expect(image.name).toBe('doubt.jpg');
    expect(await image.text()).toBe('full-size');
    expect(form.get('note')).toBe('ye step');
    expect(form.get('examId')).toBe('pet');
    expect(form.get('topicId')).toBe('t1');
    // no hand-written Content-Type: the browser adds the multipart boundary itself
    expect(config).toBeUndefined();
  });

  it('after a reload only the thumbnail is left, and that is what gets sent', async () => {
    const thumbnail = new Blob(['small'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ blob: async () => thumbnail }),
    );
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });

    await analyzeDoubtPhoto({ imageUri: 'data:forgotten', ...base });

    expect(fetch).toHaveBeenCalledWith('data:forgotten');
    expect(await post.mock.calls[0][1].get('image').text()).toBe('small');
  });

  it('leaves out the fields that are empty', async () => {
    rememberImage('data:t2', new Blob(['x']));
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });
    await analyzeDoubtPhoto({ imageUri: 'data:t2' });
    const form = post.mock.calls[0][1];
    expect(form.has('note')).toBe(false);
    expect(form.has('examId')).toBe(false);
    expect(form.has('topicId')).toBe(false);
  });

  it('a 429 becomes the quota message', async () => {
    rememberImage('data:t3', new Blob(['x']));
    vi.spyOn(apiClient, 'post').mockRejectedValue(tooMany());
    await expect(analyzeDoubtPhoto({ imageUri: 'data:t3' })).rejects.toThrow(
      AI_QUOTA_MESSAGE,
    );
  });
});

describe('mock mode is unchanged', () => {
  beforeEach(() => {
    env.USE_MOCK_API = true;
  });
  afterEach(() => {
    env.USE_MOCK_API = false;
  });

  it('never touches the network', async () => {
    const post = vi.spyOn(apiClient, 'post');
    vi.useFakeTimers();
    const pending = sendMessage({ conversationId: 'c', text: 'x' });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(pending).resolves.toMatchObject({ role: 'ai' });
    vi.useRealTimers();
    expect(post).not.toHaveBeenCalled();
  });
});
