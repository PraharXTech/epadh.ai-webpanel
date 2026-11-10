import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CropHost from '@/app/CropHost';
import { requestCrop, setCropListener } from '@/services/media/cropRequests';
import { hasTouchScreen, pickFile } from '@/services/media/filePicker';
import { recallImage, rememberImage } from '@/services/media/imageRegistry';
import { blobToDataUrl, renderToBlob } from '@/services/media/imageTools';
import {
  pickAvatar,
  pickerErrorMessage,
  pickFromGallery,
  pickOmrSheet,
  processImageFile,
} from '@/services/media/photoPicker';

// jsdom has no image decoding or canvas. These fakes stand in for the browser: the "bitmap" is
// a size, the canvas records what is drawn on it, and toBlob returns a small Blob.
const drawn = [];
let bitmapSize = { width: 3000, height: 1500 };

beforeEach(() => {
  drawn.length = 0;
  bitmapSize = { width: 3000, height: 1500 };
  globalThis.createImageBitmap = vi.fn(async () => ({
    ...bitmapSize,
    close: vi.fn(),
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function () {
      return {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: (...args) =>
          drawn.push({ args, w: this.width, h: this.height }),
      };
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    function (done, mime) {
      done(new Blob([`${this.width}x${this.height}`], { type: mime }));
    },
  );
  URL.createObjectURL = vi.fn(() => 'blob:processed');
  setCropListener(null);
});
afterEach(() => {
  vi.restoreAllMocks();
  setCropListener(null);
});

const photo = (name = 'p.jpg', type = 'image/jpeg') =>
  new File(['img'], name, { type });

describe('imageTools.renderToBlob', () => {
  const bitmap = size => ({ ...size });

  it('shrinks a large image so its longer side is the limit', async () => {
    const { width, height } = await renderToBlob(
      bitmap({ width: 3000, height: 1500 }),
      { maxSize: 1600 },
    );
    expect([width, height]).toEqual([1600, 800]);
  });

  it('never scales a small image up', async () => {
    const { width, height } = await renderToBlob(
      bitmap({ width: 400, height: 300 }),
      { maxSize: 1600 },
    );
    expect([width, height]).toEqual([400, 300]);
  });

  it('draws only the chosen rectangle', async () => {
    await renderToBlob(bitmap({ width: 3000, height: 1500 }), {
      crop: { x: 100, y: 50, width: 800, height: 400 },
      maxSize: 1600,
    });
    expect(drawn[0].args.slice(1)).toEqual([100, 50, 800, 400, 0, 0, 800, 400]);
  });

  it('scales a crop down too', async () => {
    const { width, height } = await renderToBlob(
      bitmap({ width: 4000, height: 4000 }),
      {
        crop: { x: 0, y: 0, width: 3200, height: 1600 },
        maxSize: 1600,
      },
    );
    expect([width, height]).toEqual([1600, 800]);
  });

  it('encodes with the requested type and quality', async () => {
    const { blob } = await renderToBlob(bitmap({ width: 100, height: 100 }), {
      quality: 0.5,
      mime: 'image/png',
    });
    expect(blob.type).toBe('image/png');
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      0.5,
    );
  });

  it('fails clearly when the browser cannot encode the image', async () => {
    HTMLCanvasElement.prototype.toBlob.mockImplementation(done => done(null));
    await expect(
      renderToBlob(bitmap({ width: 10, height: 10 })),
    ).rejects.toThrow(/Could not process/);
  });

  it('blobToDataUrl gives a data: URL', async () => {
    const url = await blobToDataUrl(new Blob(['abc'], { type: 'image/jpeg' }));
    expect(url).toMatch(/^data:image\/jpeg;base64,/);
  });
});

describe('photoPicker.processImageFile', () => {
  it('rejects a file that is not an image', async () => {
    await expect(
      processImageFile(photo('notes.pdf', 'application/pdf')),
    ).rejects.toMatchObject({ code: 'E_NOT_AN_IMAGE' });
  });

  it('rejects an image the browser cannot decode', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('bad'));
    await expect(processImageFile(photo())).rejects.toMatchObject({
      code: 'E_DECODE',
    });
  });

  it('returns null when the student cancels the crop', async () => {
    setCropListener(request => request.resolve(null));
    await expect(processImageFile(photo())).resolves.toBeNull();
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('a doubt photo is cropped, shrunk to 1600 px and given a small thumbnail', async () => {
    let asked;
    setCropListener(request => {
      asked = request;
      request.resolve({ crop: { x: 0, y: 0, width: 3000, height: 1500 } });
    });
    const image = await processImageFile(photo(), 'doubt');
    expect(asked).toMatchObject({
      title: 'Crop your doubt',
      aspect: null,
      round: false,
    });
    expect([image.width, image.height]).toEqual([1600, 800]);
    expect(image.uri).toBe('blob:processed');
    expect(image.mime).toBe('image/jpeg');
    expect(image.thumbUri).toMatch(/^data:image\/jpeg;base64,/);
    // the thumbnail is the small one (480 px), and the full image is kept for the upload
    expect(drawn.map(d => d.w)).toEqual([1600, 480]);
    expect(recallImage(image.thumbUri)).toBe(image.blob);
  });

  it('a profile photo is a 600 px square with a round guide', async () => {
    bitmapSize = { width: 2000, height: 2000 };
    let asked;
    setCropListener(request => {
      asked = request;
      request.resolve({ crop: { x: 0, y: 0, width: 2000, height: 2000 } });
    });
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        Object.defineProperty(this, 'files', { value: [photo()] });
        this.dispatchEvent(new Event('change'));
      },
    );
    const image = await pickAvatar();
    expect(asked).toMatchObject({
      aspect: 1,
      round: true,
      title: 'Crop your photo',
    });
    expect([image.width, image.height]).toEqual([600, 600]);
  });

  it('an OMR sheet keeps far more detail (2600 px at high quality)', async () => {
    bitmapSize = { width: 4000, height: 3000 };
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        Object.defineProperty(this, 'files', { value: [photo()] });
        this.dispatchEvent(new Event('change'));
      },
    );
    const image = await pickOmrSheet();
    expect(Math.max(image.width, image.height)).toBe(2600);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.9,
    );
  });

  it('the bitmap is released afterwards', async () => {
    const close = vi.fn();
    globalThis.createImageBitmap = vi.fn(async () => ({
      width: 100,
      height: 100,
      close,
    }));
    await processImageFile(photo());
    expect(close).toHaveBeenCalled();
  });

  it('pickFromGallery returns null when the student closes the file chooser', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        this.dispatchEvent(new Event('cancel'));
      },
    );
    await expect(pickFromGallery()).resolves.toBeNull();
  });
});

describe('pickerErrorMessage', () => {
  it('turns error codes into advice', () => {
    expect(pickerErrorMessage({ code: 'E_NOT_AN_IMAGE' })).toMatch(
      /choose a photo/,
    );
    expect(pickerErrorMessage({ code: 'E_DECODE' })).toMatch(
      /couldn't be opened/,
    );
    expect(pickerErrorMessage(new Error('anything'))).toMatch(
      /Couldn't add the photo/,
    );
  });
});

describe('filePicker', () => {
  it('resolves with the chosen file and cleans up its hidden input', async () => {
    const file = photo();
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        expect(this.type).toBe('file');
        expect(this.accept).toBe('image/*');
        Object.defineProperty(this, 'files', { value: [file] });
        this.dispatchEvent(new Event('change'));
      },
    );
    await expect(pickFile({ accept: 'image/*' })).resolves.toBe(file);
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('resolves null when the chooser is cancelled, and only once', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        this.dispatchEvent(new Event('cancel'));
        this.dispatchEvent(new Event('change')); // a late event must not matter
      },
    );
    await expect(pickFile({})).resolves.toBeNull();
  });

  it('asks a phone to open its camera directly', async () => {
    let capture;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function () {
        capture = this.getAttribute('capture');
        this.dispatchEvent(new Event('cancel'));
      },
    );
    await pickFile({ accept: 'image/*', capture: 'environment' });
    expect(capture).toBe('environment');
  });

  it('hasTouchScreen follows the primary pointer', () => {
    window.matchMedia = query => ({ matches: query === '(pointer: coarse)' });
    expect(hasTouchScreen()).toBe(true);
    window.matchMedia = () => ({ matches: false });
    expect(hasTouchScreen()).toBe(false);
  });
});

describe('imageRegistry', () => {
  it('finds a full image by its thumbnail and keeps only the last few', () => {
    const blobs = Array.from({ length: 10 }, (_, i) => new Blob([String(i)]));
    blobs.forEach((blob, i) => rememberImage(`thumb-${i}`, blob));
    expect(recallImage('thumb-0')).toBeNull(); // pushed out
    expect(recallImage('thumb-1')).toBeNull();
    expect(recallImage('thumb-2')).toBe(blobs[2]);
    expect(recallImage('thumb-9')).toBe(blobs[9]);
    expect(recallImage('never-saved')).toBeNull();
  });

  it('remembering the same photo again refreshes it', () => {
    const first = new Blob(['a']);
    const second = new Blob(['b']);
    rememberImage('same', first);
    rememberImage('same', second);
    expect(recallImage('same')).toBe(second);
  });
});

describe('the crop dialog (CropHost)', () => {
  it('with no host mounted, the whole image is used', async () => {
    await expect(requestCrop({ file: photo() })).resolves.toEqual({
      crop: null,
    });
  });

  it('shows when the picker asks, and Cancel gives null', async () => {
    render(<CropHost />);
    const pending = requestCrop({ file: photo(), title: 'Crop your doubt' });
    const dialog = await screen.findByRole('dialog', {
      name: 'Crop your doubt',
    });
    expect(dialog).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(pending).resolves.toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Use photo hands back the chosen area (the whole image until the student moves it)', async () => {
    render(<CropHost />);
    const pending = requestCrop({ file: photo(), title: 'Crop photo' });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Use photo' }),
    );
    await expect(pending).resolves.toEqual({ crop: null });
  });

  it('Escape closes it like Cancel', async () => {
    render(<CropHost />);
    const pending = requestCrop({ file: photo() });
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await expect(pending).resolves.toBeNull();
  });

  it('has a zoom slider', async () => {
    render(<CropHost />);
    requestCrop({ file: photo() });
    expect(await screen.findByLabelText('Zoom')).toHaveAttribute(
      'type',
      'range',
    );
  });
});
