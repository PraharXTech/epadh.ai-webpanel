import { useRef, useState } from 'react';
import ViewerMessage from './ViewerMessage';

const PROGRESS_EVERY_MS = 2000; // mobile: progressUpdateInterval

// Streams the video with the browser's native controls (play, seek, speed, fullscreen,
// picture-in-picture). Reports how much has been watched (0-100) and resumes from the saved
// spot. Web port of the react-native-video version, same props.
export default function VideoPlayer({ url, savedPercent = 0, onProgress }) {
  const videoRef = useRef(null);
  const resumed = useRef(false);
  const lastReport = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleLoaded = () => {
    const video = videoRef.current;
    setBuffering(false);
    if (
      !resumed.current &&
      savedPercent > 0 &&
      savedPercent < 100 &&
      video?.duration > 0
    ) {
      resumed.current = true;
      video.currentTime = (savedPercent / 100) * video.duration;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const now = Date.now();
    if (!video?.duration || now - lastReport.current < PROGRESS_EVERY_MS) {
      return;
    }
    lastReport.current = now;
    onProgress?.((video.currentTime / video.duration) * 100);
  };

  const retry = () => {
    setFailed(false);
    setBuffering(true);
    setAttempt(n => n + 1);
  };

  return (
    <div className="relative aspect-video w-full bg-black">
      {failed ? (
        <div className="flex h-full bg-white">
          <ViewerMessage
            title="Couldn't play this video"
            detail="Check your connection and try again."
            actionLabel="Retry"
            onAction={retry}
          />
        </div>
      ) : (
        <>
          <video
            key={attempt}
            ref={videoRef}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
            onLoadedMetadata={handleLoaded}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onPlaying={() => setBuffering(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => onProgress?.(100)}
            onError={() => setFailed(true)}
          />
          {buffering ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                role="status"
                aria-label="Loading video"
                className="h-9 w-9 animate-spin rounded-full border-[3px] border-white border-t-transparent"
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
