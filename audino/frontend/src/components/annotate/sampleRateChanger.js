import React from 'react';
import { Button } from '../button';

const SampleRateChanger = props => {
    const {annotate, state} =  props
    const {wavesurfer} = state
    const [text, setText] = React.useState("")
    const handleSubmit = () => {
      const int = parseInt(text, 10)
      console.log(int)

      const newState = annotate.initalState;
      newState["sampleRate"] = int || 44100
      annotate.setState(newState, () => {
        wavesurfer.destroy();
        annotate.componentDidMount();
      });
    }

    const inputText = e => {
      setText(e.target.value)
    }

    return (
      <div className="col 4">
        <input type="text" id="fname" name="fname" onChange={e => inputText(e)}/>
        <Button text="submit" onClick={() => handleSubmit()} type="primary" />
      </div>
    )
};

export default SampleRateChanger;
