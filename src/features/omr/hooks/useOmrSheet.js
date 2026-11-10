import { useState } from 'react';
import { pickPdf } from '@/services/media/documentPicker';
import {
  captureOmrSheet,
  pickOmrSheet,
  pickerErrorMessage,
} from '@/services/media/photoPicker';
import { showAlert } from '@/services/alerts/alertStore';
import { ensureOnline } from '@/services/network/ensureOnline';
import { uploadOmrSheet } from '../services/omrService';
import { imageSheet, pdfProblem, pdfSheet } from '../utils/omrSheet';

const warn = message =>
  showAlert('OMR scanner', message, null, { tone: 'warning', icon: 'scan' });

// Drives the OMR scan screen: choose a sheet (camera, gallery or PDF), keep it while
// the student looks it over, then upload it. Backing out of a picker changes nothing.
export default function useOmrSheet() {
  const [sheet, setSheet] = useState(null); // { kind, uri, ... } | null
  const [uploading, setUploading] = useState(false);

  const choose = async source => {
    try {
      if (source === 'pdf') {
        const pdf = await pickPdf();
        const problem = pdf ? pdfProblem(pdf) : null;
        if (problem) {
          warn(problem);
        } else if (pdf) {
          setSheet(pdfSheet(pdf));
        }
        return;
      }
      const image = await (source === 'camera'
        ? captureOmrSheet()
        : pickOmrSheet());
      if (image) {
        setSheet(imageSheet(image));
      }
    } catch (e) {
      warn(
        source === 'pdf'
          ? "Couldn't open that PDF. Please try again."
          : pickerErrorMessage(e),
      );
    }
  };

  const clear = () => setSheet(null);

  // Resolves to the upload result, or null when offline / failed (the student has
  // already been told why).
  const scan = async () => {
    if (!sheet || uploading || !ensureOnline('omr')) {
      return null;
    }
    setUploading(true);
    try {
      return await uploadOmrSheet({ sheet });
    } catch {
      warn(
        "Couldn't upload the sheet. Please check your connection and try again.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { sheet, uploading, choose, clear, scan };
}
