import React from 'react';
import { Button } from '../button';

const SampleRateChanger = props => {
    const {annotate, state} =  props
    const {wavesurfer, filename, spectrogram} = state
    const [text, setText] = React.useState("")
    const [hz, setHz] = React.useState(0)
    const [hz2, setHz2] = React.useState(Number(wavesurfer.backend.offlineAc.sampleRate/1000))

    const handleSubmit = () => {
      const int = parseInt(text, 10)

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

    return (
      <div className="sideMenuItem">
       <input
        type="range"
        min="0"
        max={`${Number(wavesurfer.backend.offlineAc.sampleRate/1000) - 1}`}
        value={hz}
        onChange={e => {
          setHz(e.target.value)
          spectrogram.scale(e.target.value, hz2, wavesurfer.backend.offlineAc.sampleRate/1000)
        }} />
       <input
        type="range"
        min="1"
        max={`${Number(wavesurfer.backend.offlineAc.sampleRate/1000)}`}
        value={hz2}
        onChange={e => {
          setHz2(e.target.value);
          spectrogram.scale(0, e.target.value, Math.ceil(wavesurfer.backend.offlineAc.sampleRate/1000))
          /*Object.values(wavesurfer.regions.list).forEach(segment => {
            segment.scale(e.target.value * 1000)
          })*/
        }}
      />
      {hz/2 + " - " + hz2/2 + " khz"}
      </div>
    )
};

export default SampleRateChanger;
