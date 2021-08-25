import React from 'react';
import { Button } from '../button';

const SampleRateChanger = props => {
    const {annotate, state} =  props
    const {wavesurfer, filename} = state
    const [text, setText] = React.useState("")
    const [hz, setHz] = React.useState(44.1)
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

    return (
      <div className="sideMenuItem">
        <input
        type="range"
        min="0"
        max="300"
        value={hz}
        onChange={e => {
          ChangeColorChange(e);
        }}
      />
      {hz/2 + "khz"}
      </div>
    )
};

export default SampleRateChanger;
