import { useParams } from "react-router";

class Spectrogram {
    constructor(wavesurfer, spectrCc, imageData) {
        console.log("okay")

        this.wavesurfer = wavesurfer
        this.spectrCc = spectrCc
        this.imageData = imageData
        console.log("good")


        this.wavesurfer.fireEvent('spectrogram_created', this);
        console.log("gooder")
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
        const cpImageData = this.spectrCc.createImageData(this.imageData.width, this.imageData.height)
        const data = cpImageData.data
        const oldData = this.imageData.data
        //https://stackoverflow.com/questions/10521978/html5-canvas-image-contrast
        contrast = (contrast)/50000000;  //convert to decimal & shift range: [0..2]
        console.log(contrast)
        var intercept = 1 * (contrast);

        for(var i=0;i<data.length;i+=4){   //r,g,b,a
            data[i]   =   oldData[i]*contrast + intercept;
            data[i+1] = oldData[i+1]*contrast + intercept;
            data[i+2] = oldData[i+2]*contrast + intercept;
        }
        console.log(data[1000], oldData[1000])
        this.spectrCc.putImageData(cpImageData, 0, 0);
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
