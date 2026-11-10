// Tiny pub-sub so non-React code (the photo picker service) can ask for the crop dialog and
// await the result, the same trick services/alerts/alertStore.js uses for alerts. The one
// <CropHost/> mounted at the app root (app/CropHost.jsx) listens and shows the dialog.
let listener = null;

export const setCropListener = fn => {
  listener = fn;
};

// Resolves with `{ crop }` (the chosen rectangle in image pixels, or null for the whole
// image), or with null when the student cancels. With no host mounted (a test, or a page that
// forgot it) it resolves with the whole image so the rest of the flow still works.
export const requestCrop = request =>
  new Promise(resolve => {
    if (!listener) {
      resolve({ crop: null });
      return;
    }
    listener({ ...request, resolve });
  });
