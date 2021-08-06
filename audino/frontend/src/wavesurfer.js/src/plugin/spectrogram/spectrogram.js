import { useParams } from "react-router";

class Spectrogram {
    constructor(wavesurfer, spectrCc, imageData) {
        console.log("okay")

        this.wavesurfer = wavesurfer
        this.spectrCc = spectrCc
        this.imageData = imageData

        this.wavesurfer.fireEvent('spectrogram_created', this);
        const {width, height, data} = this.imageData
        this.copyID = this.copy(width, height, data)
    }

    copy() {
        const {width, height } = this.imageData
        this.spectrCc.putImageData(this.imageData, 0, 0);
        let copy = this.spectrCc.getImageData(0, 0, width, height)
        this.spectrCc.putImageData(copy, 0, 0);
        return copy
    }

    Truncate(value) {
        if (value < 0) {
            value = 0;
        }
        else if (value > 255) {
            value = 255;
        }
        return value
    }

     // SPECTROGRAM MANIPLUATION CODE //
    invert() {
        const data = this.imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            data[i]     = 255 - data[i];     // red
            data[i + 1] = 255 - data[i + 1]; // green
            data[i + 2] = 255 - data[i + 2]; // blue
        }
        this.spectrCc.putImageData(this.imageData, 0, 0);
    }

    contrast(contrast) {
        const copy = this.copy()
        //https://www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/
        var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const data = copy.data
        for(var i=0;i<data.length;i+=4)
        {
            data[i] = factor * (data[i] - 128) + 128;
            data[i+1] = factor * (data[i+1] - 128) + 128;
            data[i+2] = factor * (data[i+2] - 128) + 128;
        }
        this.spectrCc.putImageData(copy, 0, 0);
    }

    brightness(bright) {
        const copy = this.copy()
        bright = (((bright)) * 255/2)
        const data = copy.data;
        for (var i = 0; i < data.length; i += 4) {
            data[i]     = this.Truncate(data[i] + bright);     // red
            data[i + 1] = this.Truncate(data[i + 1] + bright); // green
            data[i + 2] = this.Truncate(data[i + 2] + bright);
            data[i + 3] = data[i + 3]
        }
        this.spectrCc.putImageData(copy, 0, 0);
    }

    reduceBrightness() {
        const data = this.imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            if ((data[i] +  data[i + 1] + data[i + 2] < 200)/3) {
                data[i]     = data[i] / 2;     // red
                data[i + 1] = data[i + 1] / 2; // green
                data[i + 2] = data[i + 2] /  2; // blue
            }
            else {
                data[i]     = data[i] / 1.05;     // red
                data[i + 1] = data[i + 1] / 1.05; // green
                data[i + 2] = data[i + 2] / 1.05; // blue
            }
        }

        this.spectrCc.putImageData(this.imageData, 0, 0);
    }
}

export default Spectrogram
