/* eslint-enable complexity, no-redeclare, no-var, one-var */
/* eslint-disable no-unused-vars, import/no-extraneous-dependencies */
const colormap = require('colormap');

class Spectrogram {
  constructor(wavesurfer, spectrCc, imageData, pixels, heightFactor) {
    this.wavesurfer = wavesurfer;
    this.spectrCc = spectrCc;
    this.imageData = imageData;
    this.pixels = pixels;
    this.heightFactor = heightFactor;

    this.wavesurfer.fireEvent('spectrogram_created', this);
    const { width, height, data } = this.imageData;
    this.copyID = this.copy(width, height, data);

    // TODO: capture frequency data output then use it to import new colormaps
  }

  copy() {
    const { width, height } = this.imageData;
    this.spectrCc.putImageData(this.imageData, 0, 0);
    const copy = this.spectrCc.getImageData(0, 0, width, height);
    this.spectrCc.putImageData(copy, 0, 0);
    return copy;
  }

  Truncate(value) {
    if (value < 0) {
      value = 0;
    } else if (value > 255) {
      value = 255;
    }
    return value;
  }

  // SPECTROGRAM MANIPLUATION CODE //
  invert() {
    const data = this.imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]; // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    this.spectrCc.putImageData(this.imageData, 0, 0);
  }

  contrast(contrast) {
    const copy = this.copy();
    // https://www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const data = copy.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
    this.spectrCc.putImageData(copy, 0, 0);
  }

  brightness(bright) {
    const copy = this.copy();
    bright = (bright * 255) / 2;
    const data = copy.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.Truncate(data[i] + bright); // red
      data[i + 1] = this.Truncate(data[i + 1] + bright); // green
      data[i + 2] = this.Truncate(data[i + 2] + bright);
      data[i + 3] = data[i + 3];
    }
    this.spectrCc.putImageData(copy, 0, 0);
  }

  // TODO: CREATE A FEATURE THAT CARRIES OVER SPECTROGRAM SETTINGS TO NEXT CLIP
  setColorMap(colormapType) {
    const colorMapArray = colormap({
      colormap: colormapType,
      nshades: 256,
      format: 'float',
      alpha: 1
    });

    const { width, height } = this.imageData;
    const pixels = this.pixels;
    const heightFactor = this.heightFactor;

    const imageData = this.spectrCc.createImageData(width, height);
    let i;
    let j;
    let k;

    for (i = 0; i < pixels.length; i++) {
      for (j = 0; j < pixels[i].length; j++) {
        const colorMap = colorMapArray[pixels[i][j]];
        /* eslint-disable max-depth */
        for (k = 0; k < heightFactor; k++) {
          let y = height - j * heightFactor;
          if (heightFactor === 2 && k === 1) {
            y--;
          }
          const redIndex = y * (width * 4) + i * 4;
          imageData.data[redIndex] = colorMap[0] * 255;
          imageData.data[redIndex + 1] = colorMap[1] * 255;
          imageData.data[redIndex + 2] = colorMap[2] * 255;
          imageData.data[redIndex + 3] = colorMap[3] * 255;
        }
        /* eslint-enable max-depth */
      }
    }
    this.spectrCc.putImageData(imageData, 0, 0);
    this.imageData = imageData;
  }
}

export default Spectrogram;
