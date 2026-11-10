// OMR scan upload. Real endpoint: POST /omr/scan (multipart: `sheet` = the photo or
// PDF, plus `testId` when the student chose an answer key) -> { scanId } (plan.md
// §5.12). Detection and scoring happen on the server; this mock only proves out the
// pick -> upload flow until that endpoint exists.
import { apiClient } from '@/api/client';
import { USE_MOCK_API } from '@/config/env';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const uploadOmrSheet = async ({ sheet, testId }) => {
  if (!USE_MOCK_API) {
    const form = new FormData();
    form.append('sheet', {
      uri: sheet.uri,
      name: sheet.kind === 'pdf' ? sheet.name : 'omr-sheet.jpg',
      type: sheet.kind === 'pdf' ? 'application/pdf' : 'image/jpeg',
    });
    if (testId) {
      form.append('testId', testId);
    }
    const { data } = await apiClient.post('/omr/scan', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  await delay(2800);
  return { scanId: `scan-${Date.now().toString(36)}` };
};
