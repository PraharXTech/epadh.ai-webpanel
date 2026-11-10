// Web replacement for the mobile react-native-image-crop-picker wrapper. Same exports, so the
// Photo Doubt Solver (and later OMR capture and the profile photo) do not know the difference.
//
// Flow: the browser's file chooser -> a crop dialog (components/feedback/CropDialog, through
// cropRequests) -> shrink and re-encode on a canvas -> `{ uri, thumbUri, width, height, size,
// mime, blob }`.
//   uri       a blob: URL of the processed image (this tab only)
//   thumbUri  a small data: URL, safe to keep in localStorage (a chat message stores this)
//   blob      the processed image, for uploading
// Every function resolves to null when the student backs out (not an error) and rejects only
// on a real failure (not an image, could not decode).
import { requestCrop } from './cropRequests';
import { hasTouchScreen, pickFile } from './filePicker';
import {
  blobToDataUrl,
  loadBitmap,
  renderToBlob,
  THUMBNAIL,
} from './imageTools';
import { rememberImage } from './imageRegistry';

// One entry per use. `crop`: what the dialog allows; the rest is the output size / quality.
// (Same numbers as the mobile options: doubt photos 1600 px at 0.8, avatars 600 px square,
// OMR sheets 2600 px at 0.9 because the bubbles are small.)
const PRESETS = {
  doubt: {
    crop: { title: 'Crop your doubt', aspect: null, round: false },
    maxSize: 1600,
    quality: 0.8,
  },
  avatar: {
    crop: { title: 'Crop your photo', aspect: 1, round: true },
    maxSize: 600,
    quality: 0.85,
  },
  omr: {
    crop: { title: 'Crop to the OMR sheet', aspect: null, round: false },
    maxSize: 2600,
    quality: 0.9,
  },
};

const fail = (code, message) => Object.assign(new Error(message), { code });

// File -> cropped, shrunk image. Used by the pickers below and by paste / drag-and-drop.
export const processImageFile = async (file, kind = 'doubt') => {
  const preset = PRESETS[kind];
  if (!file.type.startsWith('image/')) {
    throw fail('E_NOT_AN_IMAGE', 'That file is not an image.');
  }

  const choice = await requestCrop({ file, ...preset.crop });
  if (!choice) {
    return null;
  }

  let bitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    throw fail('E_DECODE', 'That image could not be opened.');
  }
  try {
    const { crop } = choice;
    const full = await renderToBlob(bitmap, {
      crop,
      maxSize: preset.maxSize,
      quality: preset.quality,
    });
    const small = await renderToBlob(bitmap, { crop, ...THUMBNAIL });
    const thumbUri = await blobToDataUrl(small.blob);
    rememberImage(thumbUri, full.blob);
    return {
      uri: URL.createObjectURL(full.blob),
      thumbUri,
      width: full.width,
      height: full.height,
      size: full.blob.size,
      mime: full.blob.type,
      blob: full.blob,
    };
  } finally {
    bitmap.close?.();
  }
};

const choose = async (kind, { camera = false } = {}) => {
  const file = await pickFile({
    accept: 'image/*',
    capture: camera ? 'environment' : undefined,
  });
  return file ? processImageFile(file, kind) : null;
};

export const captureFromCamera = () => choose('doubt', { camera: true });
export const pickFromGallery = () => choose('doubt');
export const captureOmrSheet = () => choose('omr', { camera: true });
export const pickOmrSheet = () => choose('omr');
export const captureAvatar = () => choose('avatar', { camera: true });
export const pickAvatar = () => choose('avatar');

// Whether "Camera" should be offered as a separate choice (touch devices only).
export const canUseCameraDirectly = hasTouchScreen;

// Turns an error into copy the student can act on instead of a raw message.
export const pickerErrorMessage = error => {
  if (error?.code === 'E_NOT_AN_IMAGE') {
    return 'Please choose a photo (JPG, PNG or similar).';
  }
  if (error?.code === 'E_DECODE') {
    return "That photo couldn't be opened. Try another one.";
  }
  return "Couldn't add the photo. Please try again.";
};
