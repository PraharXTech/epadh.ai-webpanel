import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showAlert } from '@/services/alerts/alertStore';
import {
  captureFromCamera,
  pickFromGallery,
  pickerErrorMessage,
} from '@/services/media/photoPicker';
import { sendPhotoMessage } from '../store/aiTutorSlice';

// Drives the Photo Doubt Solver (plan.md §5.9): capture or pick -> preview with an
// optional note -> send. `pending` holds the cropped image while the preview sheet
// is open; nothing is sent to the (mock) AI until the student confirms.
export default function usePhotoDoubt() {
  const dispatch = useDispatch();
  const [pending, setPending] = useState(null); // { uri, width, height } | null

  const capture = async source => {
    try {
      const image = await (source === 'camera'
        ? captureFromCamera()
        : pickFromGallery());
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

  const cancel = () => setPending(null);

  const send = note => {
    if (!pending) {
      return;
    }
    dispatch(sendPhotoMessage({ imageUri: pending.uri, note }));
    setPending(null);
  };

  return { pending, capture, cancel, send };
}
