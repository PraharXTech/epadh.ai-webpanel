// Opens the browser's file chooser and resolves with the chosen File, or null when the student
// backs out (not an error). One shared helper for photos, camera capture and PDFs.
//   pickFile({ accept: 'image/*' })                       gallery / files
//   pickFile({ accept: 'image/*', capture: 'environment' })  phones: open the camera directly
//                                                            (desktops show the normal chooser)
export const pickFile = ({ accept = '*/*', capture } = {}) =>
  new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) {
      input.setAttribute('capture', capture);
    }
    input.style.display = 'none';

    let settled = false;
    const finish = file => {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      resolve(file);
    };

    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null)); // Chrome, Edge, Firefox, Safari 16.4+
    document.body.appendChild(input);
    input.click();
  });

// A phone or tablet (touch first): worth offering "Camera" next to "Gallery". On a laptop the
// camera option would just open the same file chooser.
export const hasTouchScreen = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(pointer: coarse)').matches);
