/**
 * This file contains the wavesurferMethods Class, a class that can
 * interact with wavesurfer to adjust the render of the spectrogram and regions
 */

import React from 'react';
import {
  faBackward,
  faForward,
  faPlayCircle,
  faPauseCircle
} from '@fortawesome/free-solid-svg-icons';
import WaveSurfer from '../../wavesurfer.js/src/wavesurfer.js';
import RegionsPlugin from '../../wavesurfer.js/src/plugin/regions/index.js';
import SpectrogramPlugin from '../../wavesurfer.js/src/plugin/spectrogram/index.js';
import { IconButton } from '../../components/button';
import UnsavedButton from '../../components/annotate/extraFeatures/next_unsaved_button';

const colormap = require('colormap');

/**
 * Useful object paths:
 * wavesurfer.spectrogram.canvas
 *  - WebCanvas for rendering the spectrogram
 * 
 * wavesurfer.spectrogram.wrapper
 *  - Wrapper for the spectrogram
 * 
 * wavesurfer.drawer
 *  - Draws objects on canvas for spectrogram and regions
 *  
 * wavesurfer.regions.list
 *  - List of region data that wavesurfer currently has rendered
 */



class WavesurferMethods {
  //Props come from annotate.js
  constructor(props) {
    this.state = props.state;
    this.annotate = props.annotate;
    this.boundingBox = props.boundingBox;
    this.unsavedButton = null;
  }

  /**
   * If annotate's state changes, update the state for WavesurferMethods
   * @param {*} state 
   */
  updateState(state) {
    this.state = state;
  }

  /**
   * Change state of annotate from wavesurferMethods
   * @param {*} state 
   */
  setState(items) {
    this.annotate.setState(items);
  }

  /**
   * Initlize the canvas for spectrogram and regions without loading in audio data yet
   * @param {*} state 
   */
  loadWavesurfer() {
    //Get some state values
    const boundingBox = this.boundingBox;
    const { active } = this.state;

    //This is the color map used by the sprectogram
    const spectrogramColorMap = colormap({
      colormap: 'hot',
      nshades: 256,
      format: 'float'
    });

    //Begin the loading process
    this.setState({ isDataLoading: true });
    const fftSamples = 512;

    //Create wavesurfer with spectrogram and region plugins enabled
    //Please refer to wavesurfer.js website for what these values are
    const wavesurfer = WaveSurfer.create({
      container: '#waveform',
      barWidth: 0,
      barHeight: 0,
      height: fftSamples / 2,
      width: '100%',
      barGap: null,
      mediaControls: false,
      fillParent: true,
      scrollParent: true,
      visualization: 'invisible', // spectrogram //invisable
      minPxPerSec: 100,
      maxCanvasWidth: 5000000, // false,
      plugins: [
        SpectrogramPlugin.create({
          fftSamples,
          position: 'relative',
          container: '#wavegraph',
          labelContainer: '#waveform-labels',
          labels: true,
          scrollParent: true,
          colorMap: spectrogramColorMap,
          checkCallback: () => {
            return window.location.href.includes('annotate');
          }
        }),
        RegionsPlugin.create({
          boundingBox
        })
      ]
    });

    //Get the history react object and create a new UnsavedButton
    //TODO: WHAT DOES THE UNSAVED BUTTON DO AGAIN?????
    const { history } = this.annotate.props;
    const unsavedButton = new UnsavedButton(wavesurfer, active, this.annotate);

    //Once the webpage is changed, stop playing audio
    history.listen(() => {
      wavesurfer.stop();
    });

    //Event when wavesurfer finsihing rendering the spectrogram canvas
    wavesurfer.on('ready', () => {

      //ADJUST SIZE OF SPECTROGRAM ON THE SCREEN
      //TODO: CHECK WHY SOME DEVICES HAVE IT SO SMALL
      const screenSize = window.screen.width;
      if (screenSize > wavesurfer.getDuration() * wavesurfer.params.minPxPerSec) {
        wavesurfer.zoom(screenSize / wavesurfer.getDuration());
        wavesurfer.spectrogram._onUpdate(screenSize);
      }

      //Allow people to drag regions with mouse click
      this.state.isRendering = false;
      this.setState({ isRendering: false });
      wavesurfer.enableDragSelection({ color: 'rgba(0, 102, 255, 0.3)' });
    });

    //Event handler anytime the region is updated
    //ie: moved, annotation label change etc
    //Stops audio and sets button as unsaved
    wavesurfer.on('region-updated', region => {
      this.handlePause();
      this.styleRegionColor(region, 'rgba(0, 102, 255, 0.3)');
      unsavedButton.addUnsaved(region);
      region._onUnSave();
    });

    //Event handler for when a region is created
    //Sets region as selectedSegment
    wavesurfer.on('region-created', region => {
      //Pause playback
      this.handlePause();

      //Set the new region created as the selected region
      const { storedAnnotations, applyPreviousAnnotations } = this.annotate.state;
      const {selectedSegment} = this.state
      if (selectedSegment) {
        selectedSegment._onSelect(false);
      }

      //If we can carry over the last annotations, do so
      if (applyPreviousAnnotations) {
        region.data.annotations = storedAnnotations;
      }

      //Add region to states
      this.setState({
        selectedSegment: region
      });
      unsavedButton.addUnsaved(region, !region.saved);
    });

    /**
     * When spectrogram is rendered, save it to state for further transformations
     * These transformations are enabled in extra features, see side menu and toggleable features
     * for more info
     */
    wavesurfer.on('spectrogram_created', spectrogram => {
      this.setState({ spectrogram });
    });

    /**
     * Handle envent when user click the spectrogram
     * This currently pauses the audio
     */
    wavesurfer.on('click', () => {
      this.handlePause();
    });

    /**
     * Handle event when user clicks on a region
     * This sets the region as the selectedSegment
     */
    wavesurfer.on('region-click', (r, e) => {
      const {selectedSegment} = this.state
      if (selectedSegment) {
        selectedSegment._onSelect(false);
      }
      
      e.stopPropagation();
      this.setState({
        selectedSegment: r
      });
      r._onSelect(true);
    });

    /**
     * Handle event when user double clicks on a region
     * TThis sets the region as selected and plays the audio the region contains
     */
    wavesurfer.on('region-dblclick', (r, e) => {
      const {selectedSegment} = this.state
      if (selectedSegment) {
        selectedSegment._onSelect(false);
      }
      e.stopPropagation();
      this.setState({
        isPlaying: true,
        selectedSegment: r
      });
      r.play();
      r._onSelect(true);
    });

    /**
     * Handle event for when audio is paused
     */
    wavesurfer.on('pause', () => {
      this.setState({ isPlaying: false });
    });

    /**
     * Handle event for when audio is played
     */
    wavesurfer.on('play', () => {
      this.setState({ isPlaying: true });
    });

    this.unsavedButton = unsavedButton;
    return { wavesurfer, unsavedButton };
  }

  /**
   * Handler for when play button is pressed
   * Starts audio
   */
  handlePlay() {
    const { wavesurfer } = this.state;
    this.setState({ isPlaying: true });
    wavesurfer.play();
  }

  /**
   * Handler for when pause button is pressed
   * Stops audio
   */
  handlePause() {
    const { wavesurfer } = this.state;
    this.setState({ isPlaying: false });
    wavesurfer.pause();
  }

  /**
   * Handler for when forward button is pressed
   * Moves 5 seconds ahead
   */
  handleForward() {
    const { wavesurfer } = this.state;
    wavesurfer.skipForward(5);
  }

  /**
   * Handler for when backward button is pressed
   * Moves 5 seconds back
   */
  handleBackward() {
    const { wavesurfer } = this.state;
    wavesurfer.skipBackward(5);
  }

  /**
   * Handler for zoom value is changed
   * Forces spectrogram to rerender to zoom value
   */
  handleZoom(e) {
    const { wavesurfer } = this.state;
    const zoom = Number(e.target.value);
    wavesurfer.zoom(zoom);
    this.setState({ zoom });
  }

  /**
   * Recolors a given region with a given color
   */
  styleRegionColor(region, color) {
    region.style(region.element, {
      backgroundColor: color
    });
  }

  /**
   * Renders pause/play backwards and forwards buttons
   */
  renderButtons(isPlaying) {
    return (
      <div className="row justify-content-center my-4">
        {/** backwards button */}
        <div className="col-md-1 col-2">
          <IconButton
            icon={faBackward}
            size="2x"
            title="Skip Backward"
            onClick={() => {
              this.handleBackward();
            }}
          />
        </div>

        {/** Pause/play button: swaps based on play state */}
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

        {/** forward button */}
        <div className="col-md-1 col-2">
          <IconButton
            icon={faForward}
            size="2x"
            title="Skip Forward"
            onClick={() => {
              this.handleForward();
            }}
          />
        </div>
      </div>
    );
  }
}

export default WavesurferMethods;
