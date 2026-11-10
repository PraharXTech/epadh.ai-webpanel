import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showAlert } from '@/services/alerts/alertStore';
import {
  captureFromCamera,
  pickerErrorMessage,
  pickFromGallery,
  processImageFile,
} from '@/services/media/photoPicker';
import { sendPhotoMessage } from '../store/aiTutorSlice';

// Drives the Photo Doubt Solver (plan.md section 5.9): capture or pick -> crop -> preview with
// an optional note -> send. `pending` holds the processed image while the preview sheet is
// open; nothing is sent to the (mock) AI until the student confirms.
//
// Web changes: `addFile(file)` takes a photo that was pasted or dropped, and the chat message
// keeps the small `thumbUri` (it survives a reload; the full image is kept in memory for the
// upload, see services/media/imageRegistry.js).
export default function usePhotoDoubt() {
  const dispatch = useDispatch();
  const [pending, setPending] = useState(null); // { uri, thumbUri, width, height } | null

  const run = async load => {
    try {
      const image = await load();
      if (image) {
        setPending(image);
      }
    } catch (e) {
      showAlert('Photo Doubt Solver', pickerErrorMessage(e), null, {
        tone: 'warning',
        icon: 'camera',
      });
    }
  };

  const capture = source =>
    run(source === 'camera' ? captureFromCamera : pickFromGallery);

  const addFile = file => run(() => processImageFile(file, 'doubt'));

  const cancel = () => setPending(null);

  const send = note => {
    if (!pending) {
      return;
    }
    dispatch(
      sendPhotoMessage({ imageUri: pending.thumbUri ?? pending.uri, note }),
    );
    setPending(null);
  };

  return { pending, capture, addFile, cancel, send };
}
