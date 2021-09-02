import React from 'react';
import { faCaretDown, faPlayCircle, faPauseCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import WaveSurfer from '../wavesurfer.js/src/wavesurfer.js';
import SpectrogramPlugin from '../wavesurfer.js/src/plugin/spectrogram/index.js';
import { IconButton } from './button';

const colormap = require('colormap');
const uuid = require('uuid');

class Reference extends React.Component {
  constructor(props) {
    super(props);
    this.annotate = props.annotate;
    this.wavesurfer = null;
    this.playing = false;
    this.state = {
      isPlaying: false
    };
    this.containerId = uuid.v4();
    this.filename = props.filename;
    this.props = props;
  }

  componentDidMount() {
    const spectrogramColorMap = colormap({
      colormap: 'hot',
      nshades: 256,
      format: 'float'
    });

    const fftSamples = 512;
    const wavesurfer = WaveSurfer.create({
      container: `#waveform${this.containerId}`,
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
          container: `#wavegraph${this.containerId}`,
          labelContainer: `#waveform-labels${this.containerId}`,
          labels: false,
          scrollParent: true,
          colorMap: spectrogramColorMap,
          checkCallback: () => {
            return window.location.href.includes('annotate');
          }
        })
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
    });

    wavesurfer.on('pause', () => {
      this.isPlaying = false;
    });

    wavesurfer.load(`/audios/${this.filename}`);
    this.wavesurfer = wavesurfer;
  }

  componentWillUnmount() {
    this.wavesurfer.destroy();
  }

  handlePlay() {
    this.setState({ isPlaying: true });
    this.wavesurfer.play();
  }

  handlePause() {
    this.setState({ isPlaying: false });
    this.wavesurfer.pause();
  }

  render() {
    const { isPlaying } = this.state;
    return (
      <div className="container h-200">
        <div className="row justify-content-md-center" style={{ display: '' }}>
          <div
            id={`waveform-labels${this.containerId}`}
            style={{
              float: 'left',
              width: '100%',
              position: 'relative'
            }}
          />

          <div
            id={`wavegraph${this.containerId}`}
            style={{
              float: 'left',
              width: '200%',
              position: 'relative'
            }}
          />

          <div
            id={`waveform${this.containerId}`}
            style={{
              float: 'left',
              width: '100%',
              position: 'relative'
            }}
          />
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
    );
  }
}

class ReferenceWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = { end: false, rotation: {} };
    this.filenames = [];
    this.labels = {};
    this.annotate = props.annotate;
    this.projectId = props.projectId;
  }

  componentDidMount() {
    // TODO: replace hardcoding with api call?
    const url = `/api/current_user/projects/${this.projectId}/sample`;
    axios({
      method: 'get',
      url
    })
      .then(response => {
        const { data } = response.data;
        const rotation = {};
        data.forEach(sample => {
          let sampleLabel = sample.sample_label;
          if (sampleLabel == null) {
            sampleLabel = 'null string';
          }

          rotation[sampleLabel] = 90;

          if (this.labels[sampleLabel] == null) {
            this.labels[sampleLabel] = [];
          }
          this.labels[sampleLabel].push(sample.filename);
        });
        this.setState({ rotation });
      })
      .catch(error => {
        console.error(error);
      });
  }

  handleDropdown(e) {
    const { rotation } = this.state;
    // https://www.w3schools.com/howto/howto_js_collapsible.asp
    const id = e.currentTarget.id;
    const elementList = document.getElementsByName(id);
    const content = elementList.item(0);
    try {
      if (content.style.display === 'block') {
        content.style.display = 'none';
        rotation[id] = 90;
      } else {
        content.style.display = 'block';
        rotation[id] = 0;
      }
      this.setState({ rotation });
    } catch (e) {
      console.warn('data has not loaded yet', e);
    }
  }

  setHeight() {
    const title = document.getElementById('filename');
    if (title !== null) {
      const ref = document.getElementById('reference-window-container');
      if (ref !== null) {
        ref.style.top = `${title.offsetTop - 10}px`;
      }
    }
  }

  render() {
    this.setHeight();
    const { end, rotation } = this.state;
    const labels = this.labels;
    let thingy = '';
    if (end) {
      thingy = 'reference-window-left';
    } else {
      thingy = 'reference-window-right';
    }
    return (
      <div id="reference-window-container">
        <div id={thingy}>
          {labels
            ? Object.entries(labels).map(([key, value]) => {
                const id = key;
                return (
                  <div>
                    <button
                      id={id}
                      type="button"
                      className="collapsible"
                      onClick={e => this.handleDropdown(e)}
                    >
                      {key} <FontAwesomeIcon icon={faCaretDown} size="lg" rotation={rotation[id]} />
                    </button>
                    <div name={id} className="content">
                      {value.map(item => {
                        return <Reference filename={item} annotate={this.annotate} />;
                      })}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    );
  }
}

export { Reference, ReferenceWindow };
