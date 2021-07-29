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
}

export default Spectrogram
