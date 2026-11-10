import {
  MAX_PDF_BYTES,
  formatBytes,
  imageSheet,
  pdfProblem,
  pdfSheet,
} from '@/features/omr/utils/omrSheet';

describe('OMR sheet helpers', () => {
  it('formats sizes and stays empty when unknown', () => {
    expect(formatBytes(null)).toBe('');
    expect(formatBytes(0)).toBe('');
    expect(formatBytes(100)).toBe('1 KB');
    expect(formatBytes(340 * 1024)).toBe('340 KB');
    expect(formatBytes(2.4 * 1024 * 1024)).toBe('2.4 MB');
  });

  it('rejects a PDF over the size limit, accepts the rest', () => {
    expect(pdfProblem({ size: MAX_PDF_BYTES + 1 })).toContain('under 10.0 MB');
    expect(pdfProblem({ size: MAX_PDF_BYTES })).toBeNull();
    expect(pdfProblem({ size: null })).toBeNull();
  });

  it('tags sheets by kind', () => {
    expect(imageSheet({ uri: 'a' }).kind).toBe('image');
    expect(pdfSheet({ uri: 'a' }).kind).toBe('pdf');
  });
});
