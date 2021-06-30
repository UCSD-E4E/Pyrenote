/*! wavesurfer.js 1.1.1 (Mon, 04 Apr 2016 09:49:47 GMT)
 * https://github.com/katspaugh/wavesurfer.js
 * @license CC-BY-3.0 */
import 'wavesurfer.js';
import 'frontend/src/wavesurfer.js/lib/wavesurfer.min.js';
import 'frontend/src/wavesurfer.js/lib/wavesurfer.spectrogram.min.js';
// 'use strict';

/**
 * Purpose:
 *   Add methods getFrequencyRGB, getFrequencies, resample, drawSpectrogram
 *   to WaveSurfer.Drawer.Canvas. These methods are modified versions from the the
 *   spectrogram plugin (https://github.com/katspaugh/wavesurfer.js/blob/master/plugin/wavesurfer.spectrogram.js)
 *   to allow the wavesurfer drawer to draw a spectrogram representation when this.params.visualization is
 *   set to "spectrogram"
 * Dependencies:
 *   WaveSurfer (lib/wavesurfer.min.js & lib/wavesurfer.spectrogram.min.js)
 */
WaveSurfer.util.extend(WaveSurfer.Drawer.Canvas, {
  // Takes in integer 0-255 and maps it to rgb string
  getFrequencyRGB(colorValue) {
    if (this.params.colorMap) {
      // If the wavesurfer has a specified colour map
      const rgb = this.params.colorMap[colorValue];
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    }
    // If not just use gray scale
    return `rgb(${colorValue},${colorValue},${colorValue})`;
  },

  getFrequencies(buffer) {
    const fftSamples = this.params.fftSamples || 512;
    const channelOne = Array.prototype.slice.call(buffer.getChannelData(0));
    const bufferLength = buffer.length;
    const { sampleRate } = buffer;
    const frequencies = [];

    if (!buffer) {
      this.fireEvent('error', 'Web Audio buffer is not available');
      return;
    }

    let { noverlap } = this.params;
    if (!noverlap) {
      const uniqueSamplesPerPx = buffer.length / this.width;
      noverlap = Math.max(0, Math.round(fftSamples - uniqueSamplesPerPx));
    }

    const fft = new WaveSurfer.FFT(fftSamples, sampleRate);

    const maxSlicesCount = Math.floor(bufferLength / (fftSamples - noverlap));

    let currentOffset = 0;

    while (currentOffset + fftSamples < channelOne.length) {
      const segment = channelOne.slice(currentOffset, currentOffset + fftSamples);
      const spectrum = fft.calculateSpectrum(segment);
      const length = fftSamples / 2 + 1;
      const array = new Uint8Array(length);
      for (let j = 0; j < length; j++) {
        array[j] = Math.max(-255, Math.log10(spectrum[j]) * 45);
      }
      frequencies.push(array);
      currentOffset += fftSamples - noverlap;
    }

    return frequencies;
  },

  resample(oldMatrix) {
    const columnsNumber = this.width;
    const newMatrix = [];

    const oldPiece = 1 / oldMatrix.length;
    const newPiece = 1 / columnsNumber;

    for (let i = 0; i < columnsNumber; i++) {
      const column = new Array(oldMatrix[0].length);

      for (let j = 0; j < oldMatrix.length; j++) {
        const oldStart = j * oldPiece;
        const oldEnd = oldStart + oldPiece;
        const newStart = i * newPiece;
        const newEnd = newStart + newPiece;

        const overlap =
          oldEnd <= newStart || newEnd <= oldStart
            ? 0
            : Math.min(Math.max(oldEnd, newStart), Math.max(newEnd, oldStart)) -
              Math.max(Math.min(oldEnd, newStart), Math.min(newEnd, oldStart));

        if (overlap > 0) {
          for (var k = 0; k < oldMatrix[0].length; k++) {
            if (column[k] == null) {
              column[k] = 0;
            }
            column[k] += (overlap / newPiece) * oldMatrix[j][k];
          }
        }
      }

      const intColumn = new Uint8Array(oldMatrix[0].length);

      for (var k = 0; k < oldMatrix[0].length; k++) {
        intColumn[k] = column[k];
      }

      newMatrix.push(intColumn);
    }

    return newMatrix;
  },

  drawSpectrogram(buffer) {
    const { pixelRatio } = this.params;
    const length = buffer.duration;
    const height = (this.params.fftSamples / 2) * pixelRatio;
    const frequenciesData = this.getFrequencies(buffer);

    const pixels = this.resample(frequenciesData);

    const heightFactor = pixelRatio;

    for (let i = 0; i < pixels.length; i++) {
      for (let j = 0; j < pixels[i].length; j++) {
        this.waveCc.fillStyle = this.getFrequencyRGB(pixels[i][j]);
        this.waveCc.fillRect(i, height - j * heightFactor, 1, heightFactor);
      }
    }
  }
});

/**
 * Override the method WaveSurfer.drawBuffer to pass in the this.backend.buffer to
 * WaveSurfer.Drawer.drawPeaks since the buffer is needed to draw the spectrogram
 */
WaveSurfer.util.extend(WaveSurfer, {
  drawBuffer() {
    const nominalWidth = Math.round(
      this.getDuration() * this.params.minPxPerSec * this.params.pixelRatio
    );
    const parentWidth = this.drawer.getWidth();
    let width = nominalWidth;

    // Fill container
    if (this.params.fillParent && (!this.params.scrollParent || nominalWidth < parentWidth)) {
      width = parentWidth;
    }

    const peaks = this.backend.getPeaks(width);
    this.drawer.drawPeaks(peaks, width, this.backend.buffer);
    this.fireEvent('redraw', peaks, width);
  }
});

/**
 * Override the methods WaveSurfer.Drawer.drawPeaks to support invisible and
 * spectrogram representations
 */
WaveSurfer.util.extend(WaveSurfer.Drawer, {
  drawPeaks(peaks, length, buffer) {
    this.resetScroll();
    this.setWidth(length);
    const { visualization } = this.params;
    if (visualization === 'invisible') {
      // draw nothing
    } else if (visualization === 'spectrogram' && buffer) {
      this.drawSpectrogram(buffer);
    } else {
      this.params.barWidth ? this.drawBars(peaks) : this.drawWave(peaks);
    }
  }
});
