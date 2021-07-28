import React from 'react';
import {
  faBackward,
  faForward,
  faPlayCircle,
  faPauseCircle
} from '@fortawesome/free-solid-svg-icons';
import WaveSurfer from '../wavesurfer.js/src/wavesurfer.js';
import RegionsPlugin from '../wavesurfer.js/src/plugin/regions/index.js';
import SpectrogramPlugin from '../wavesurfer.js/src/plugin/spectrogram/index.js';
import { Button, IconButton } from '../components/button';
import axios from 'axios';
const colormap = require('colormap');
const uuid = require("uuid");


class Refrence extends React.Component{
  constructor(props) {
    super(props)
    this.annotate = props.annotate
    this.wavesurfer = null
    this.playing = false;
    this.state = {
      playing: false
    }
    this.containerId = uuid.v4();
    this.filename = props.filename
    this.props = props
  }

  componentDidMount() {



    const { active } = this.state
    const spectrogramColorMap = colormap({
      colormap: 'hot',
      nshades: 256,
      format: 'float'
    });

    this.setState({ isDataLoading: true });
    const fftSamples = 512;
    const wavesurfer = WaveSurfer.create({
      container: '#waveform' + this.containerId,
      barWidth: 0,
      barHeight: 0,
      height: fftSamples / 2,
      width: '50%',
      barGap: null,
      mediaControls: false,
      fillParent: false,
      scrollParent: true,
      visualization: 'invisible', // spectrogram //invisable
      minPxPerSec: 100,
      maxCanvasWidth: 5000000, // false,
      labels: true,
      plugins: [
        SpectrogramPlugin.create({
          fftSamples,
          position: 'relative',
          container: '#wavegraph' + this.containerId,
          labelContainer: '#waveform-labels' + this.containerId,
          labels: false,
          scrollParent: true,
          colorMap: spectrogramColorMap
        }),
      ]
    });
    const { history } = this.annotate.props;
    history.listen(() => {
      wavesurfer.stop();
    });

    wavesurfer.on('ready', () => {
      const screenSize = window.screen.width;
      if (screenSize > wavesurfer.getDuration() * wavesurfer.params.minPxPerSec) {
        wavesurfer.zoom(screenSize / wavesurfer.getDuration());
        wavesurfer.spectrogram._onUpdate(screenSize);
      }
      wavesurfer.enableDragSelection({ color: 'rgba(0, 102, 255, 0.3)' });
    });

    wavesurfer.on('pause', () => {
      this.isPlaying = false
    });

    wavesurfer.load(`/audios/${this.filename}`);
    //const { zoom } = this.state;
    //wavesurfer.zoom(zoom);


    this.wavesurfer = wavesurfer
    
  }
  
  handlePlay() {
    this.setState({ isPlaying: true });
    this.wavesurfer.play();
  }

  
  handlePause() {
    const { wavesurfer } = this.state;
    this.setState({ isPlaying: false });
    this.wavesurfer.pause();
  }

  render() { 
    const {isPlaying} = this.state
    return(
      <div className="container h-200"> 
         <div
          className="row justify-content-md-center"
          style={{ display: '' }}
        >
          <div id={"waveform-labels" + this.containerId} style={{ float: 'left', width: "100%",
  position: "relative",
  float: "left", }} />
          <div id={"wavegraph"  + this.containerId} style={{ float: 'left', width: "200%",
  position: "relative",
  float: "left"}} />
          <div id={"waveform"  + this.containerId} style={{ float: 'left', width: "100%",
  position: "relative",
  float: "left",}} />
        </div>
        <div className="col-md-1 col-2">
        {!isPlaying ? (
            <IconButton
              icon={faPlayCircle}
              size="2x"
              title="Play"
              onClick={() => {
                this.handlePlay();
              }}
            />
          ) : null}
          {isPlaying ? (
            <IconButton
              icon={faPauseCircle}
              size="2x"
              title="Pause"
              onClick={() => {
                this.handlePause();
              }}
            />
          ) : null}
          </div>
          </div>
    )
  }
}


class RefrenceWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {end: false}
    this.filenames = []
    this.annotate = props.annotate
    this.projectId = props.projectId
  }

  componentDidMount() {
    // TODO: replace hardcoding with api call?
    const url = "/api/current_user/projects/" + this.projectId + "/sample"
    axios({
      method: 'get',
      url: url
    })
      .then(response => {
        const { data} = response.data;
        console.log(data)
        data.forEach((sample) => { this.filenames.push(sample["filename"])})
        this.setState({filenames: this.filenames})
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isDataLoading: false
        });
      });
  }

  render() {
    const {end} = this.state
    const filenames = this.filenames
    var thingy = ""
    if (end) {
      thingy = "refrence-window-left"
    } else {
      thingy = "refrence-window-right"
    }
    return (
      <div id={"refrence-window-container"}>
         <div className="col justify-content-left my-4">
        <Button
        style={{zIndex: 101}}
        text="test"
        type="primary"
        title = 'test'
        size = 'sm'
        onClick={() => {this.setState({end: !end})}}
        /> 
        </div>
        <div id={thingy} >
          {filenames && filenames.map((item, index) => {
            console.log(item) 
             return (<Refrence filename={filenames[index]}
             annotate={this.annotate}/>)
          })}
        </div>
      </div>
    )
   
  }
}

export { Refrence, RefrenceWindow};
