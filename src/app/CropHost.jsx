import { lazy, Suspense, useEffect, useState } from 'react';
import { setCropListener } from '@/services/media/cropRequests';

// The cropper library is only needed when a photo is being cropped: load it on first use.
const CropDialog = lazy(() => import('@/components/feedback/CropDialog'));

// Shows the crop dialog when the photo picker service asks for one (services/media/
// cropRequests.js). Mount once, inside the providers.
export default function CropHost() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    setCropListener(setRequest);
    return () => setCropListener(null);
  }, []);

  if (!request) {
    return null;
  }
  const finish = value => {
    setRequest(null);
    request.resolve(value);
  };
  return (
    <Suspense fallback={null}>
      <CropDialog
        file={request.file}
        title={request.title}
        aspect={request.aspect}
        round={request.round}
        onDone={area => finish({ crop: area })}
        onCancel={() => finish(null)}
      />
    </Suspense>
  );
}
