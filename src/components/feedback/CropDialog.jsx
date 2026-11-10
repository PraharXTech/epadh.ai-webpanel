import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

// Crop an image before it is used. `aspect` null = free-form (the student drags the edges);
// a number fixes the shape (1 = square); `round` shows a circular guide (profile photo).
// `onDone(crop)` gets the rectangle in IMAGE pixels, `onCancel()` closes without choosing.
// react-easy-crop gives a fixed-ratio cropper; free-form uses the image's own ratio and lets
// the student zoom and move, which is the usual "crop the part you need" gesture.
export default function CropDialog({
  file,
  title = 'Crop photo',
  aspect = null,
  round = false,
  onDone,
  onCancel,
}) {
  const [url, setUrl] = useState(null);
  const [imageRatio, setImageRatio] = useState(4 / 3);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);

  // Read the file into a data: URL for the cropper. (An object URL would need revoking, and
  // React's dev double-mount would revoke it while the dialog is still showing.)
  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) {
        setUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  const onCropComplete = useCallback((_, pixels) => setArea(pixels), []);

  return (
    <Modal open title={title} placement="bottom" onClose={onCancel}>
      <div className="p-4">
        <h3
          aria-hidden="true"
          className="mb-3 text-lg font-bold text-slate-900">
          {title}
        </h3>
        <div className="relative h-72 overflow-hidden rounded-2xl bg-slate-900 sm:h-80">
          {url ? (
            <Cropper
              image={url}
              crop={crop}
              zoom={zoom}
              aspect={aspect ?? imageRatio}
              cropShape={round ? 'round' : 'rect'}
              showGrid={!round}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={media =>
                setImageRatio(media.naturalWidth / media.naturalHeight)
              }
            />
          ) : null}
        </div>
        <label className="mt-3 flex items-center gap-3 text-xs font-medium text-slate-600">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={event => setZoom(Number(event.target.value))}
            className="flex-1"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onDone(area)} data-autofocus>
            Use photo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
