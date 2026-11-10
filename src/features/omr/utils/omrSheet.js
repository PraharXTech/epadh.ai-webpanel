// An OMR sheet is either a photo (camera or gallery) or a PDF. `kind` tells them apart.
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export const OMR_TIPS = [
  'Place the sheet on a flat surface in good light.',
  'Keep all four corners inside the frame.',
  'Avoid shadows and glare on the bubbles.',
  'Hold the phone straight above the sheet.',
];

// "2.4 MB", "340 KB"; empty when the size is unknown.
export const formatBytes = bytes => {
  if (!bytes || bytes < 0) {
    return '';
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// Why a picked PDF cannot be used, or null when it is fine.
export const pdfProblem = pdf => {
  if (pdf.size && pdf.size > MAX_PDF_BYTES) {
    return `This PDF is ${formatBytes(
      pdf.size,
    )}. Please pick one under ${formatBytes(MAX_PDF_BYTES)}.`;
  }
  return null;
};

export const imageSheet = image => ({ ...image, kind: 'image' });
export const pdfSheet = pdf => ({ ...pdf, kind: 'pdf' });
