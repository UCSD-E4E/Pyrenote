import React from 'react';
import { Button } from '../button';

const SampleRateChanger = props => {
    const {annotate, state} =  props
    const {wavesurfer, filename, spectrogram} = state
    const [text, setText] = React.useState("")
    console.log("init", wavesurfer.backend.offlineAc.sampleRate)
    console.log(wavesurfer.backend.offlineAc.sampleRate/2000)
    const [hz, setHz] = React.useState(Number(wavesurfer.backend.offlineAc.sampleRate/1000))
    const [hz2, setHz2] = React.useState(Number(wavesurfer.backend.offlineAc.sampleRate/1000))
    console.log(hz2)
    const handleSubmit = () => {
      const int = parseInt(text, 10)
      console.log(int)

      const newState = annotate.initalState;
      newState["sampleRate"] = int || 44100
      wavesurfer.load(`/audios/${filename}`, null, null, null, int );
    }

    const inputText = e => {
      setText(e.target.value)
    }

    const ChangeColorChange = e => {
      setHz(e.target.value)
      wavesurfer.empty()
      wavesurfer.load(`/audios/${filename}`, null, null, null, e.target.value * 1000);
    }
    console.log(hz2)
    return (
      <div className="sideMenuItem">
       {/* <input
        type="range"
        min="0"
        max="300"
        value={hz}
        onChange={e => {
          ChangeColorChange(e);
        }}
      />*/}
       <input
        type="range"
        min="0"
        max="600"
        value={hz2}
        onChange={e => {
          setHz2(e.target.value);
          spectrogram.scale(0, e.target.value, wavesurfer.backend.offlineAc.sampleRate/2000)
          console.log(wavesurfer.backend.offlineAc.sampleRate)
          /*Object.values(wavesurfer.regions.list).forEach(segment => {
            segment.scale(e.target.value * 1000)
          })*/
        }}
      />
      {hz2/2 + "khz"}
      </div>
    )
};

export default SampleRateChanger;
