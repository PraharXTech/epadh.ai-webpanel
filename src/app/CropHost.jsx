import { useEffect, useState } from 'react';
import CropDialog from '@/components/feedback/CropDialog';
import { setCropListener } from '@/services/media/cropRequests';

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
    <CropDialog
      file={request.file}
      title={request.title}
      aspect={request.aspect}
      round={request.round}
      onDone={area => finish({ crop: area })}
      onCancel={() => finish(null)}
    />
  );
}
