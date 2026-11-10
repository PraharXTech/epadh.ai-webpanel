// Browser image helpers for the photo pickers: decode, crop, shrink and re-encode.
// Everything runs on the student's device (canvas); nothing is uploaded from here.

// Decodes a File / Blob. `imageOrientation: 'from-image'` applies the phone camera's EXIF
// rotation, so a photo taken in portrait is not drawn sideways. Same orientation the
// browser shows in <img>, so crop rectangles from the cropper line up.
export const loadBitmap = blob =>
  createImageBitmap(blob, { imageOrientation: 'from-image' });

// Draws `crop` (pixels of the decoded image; the whole image when omitted), scaled down so
// neither side exceeds `maxSize`, and encodes it. Never scales UP.
export const renderToBlob = async (
  bitmap,
  { crop, maxSize = 1600, quality = 0.8, mime = 'image/jpeg' } = {},
) => {
  const source = crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (mime === 'image/jpeg') {
    context.fillStyle = '#ffffff'; // JPEG has no transparency
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(
    bitmap,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    width,
    height,
  );
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!blob) {
    throw new Error('Could not process the image.');
  }
  return { blob, width, height };
};

// A small data: URL of an image, for things that must survive a reload (a chat message's
// picture is saved in localStorage; a blob: URL would be dead after the tab closes).
export const blobToDataUrl = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const THUMBNAIL = { maxSize: 480, quality: 0.7 };
