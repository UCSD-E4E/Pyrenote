/* eslint "no-nested-ternary": "off" */
import React from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import { AlertSection } from '../components/alert';
import WavesurferMethods from './annotateHelpers/wavesurferMethods.js';
import { ReferenceWindow} from '../components/reference';
import NavButton from '../components/annotate/navbutton';
import Spectrogram from '../components/annotate/spectrogram';
import LabelSection from '../components/annotate/labelsSection';
import LabelButton from '../components/annotate/labelButtons';
import RenderingMsg from '../components/annotate/renderingMsg';
import MarkedForReview from '../components/annotate/markedForReview';
import PreviousAnnotationButton from '../components/annotate/extraFeatures/previousAnnotationButton';
import ChangePlayback from '../components/annotate/extraFeatures/changePlayback';

class Annotate extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.projectid);
    const dataId = Number(match.params.dataid);
    const index = window.location.href.indexOf('/projects');

    this.initalState = {
      playbackRate: 0,
      next_data_url: '',
      next_data_id: -1,
      isPlaying: false,
      projectId,
      dataId,
      labels: {},
      labelsUrl: `/api/projects/${projectId}/labels`,
      dataUrl: `/api/projects/${projectId}/data/${dataId}`,
      segmentationUrl: `/api/projects/${projectId}/data/${dataId}/segmentations`,
      isDataLoading: false,
      wavesurfer: null,
      zoom: 100,
      playbackRate: 100,
      isMarkedForReview: false,
      isMarkedForReviewLoading: false,
      selectedSegment: null,
      isSegmentDeleting: false,
      errorMessage: null,
      errorUnsavedMessage: null,
      successMessage: null,
      isRendering: true,
      data: [],
      previous_pages: [],
      num_of_prev: 0,
      numpage: 5,
      path: window.location.href.substring(0, index),
      direction: null,
      referenceWindowOn: false,
      storedAnnotations: null,
      // applyPreviousAnnotations: false,
      boundingBox: true,
      initWavesurfer: false
    };
    this.state = this.initalState;
    this.lastTime = 0;
    this.labelRef = {};
    this.UnsavedButton = null;
  }

  componentDidMount() {
    this.lastTime = Date.now();
    this.savePrevious();

    const { dataId, projectId, labelsUrl, dataUrl } = this.state;
    const apiUrl = `/api/current_user/unknown/projects/${projectId}/data/${dataId}`;

    let boundingBox = null;
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/toggled`
    })
      .then(response => {
        // take all the current values of featuresList, include the new ones defined at the line 27
        boundingBox = response.data.features_list['2D Labels'];
        this.setState({
          navButtonsEnabled: response.data.features_list['next button'],
          // applyPreviousAnnotations: response.data.features_list['auto annotate'],
          toUnsavedClipOn: response.data.features_list['to unsaved cliped'],
          playbackOn: response.data.features_list.playbackOn,
          referenceWindowOn: response.data.features_list['reference window'],
        });

        axios({
          method: 'get',
          url: apiUrl
        })
          .then(response => {
            this.loadNextData(response);
          })
          .catch(error => {
            this.setState({
              errorMessage: error.response.data.message,
              isDataLoading: false
            });
          })

        const wavesurferMethods = new WavesurferMethods({
          annotate: this,
          state: this.state,
          boundingBox
        });
        const { wavesurfer, unsavedButton } = wavesurferMethods.loadWavesurfer();
        this.UnsavedButton = unsavedButton;
        axios
          .all([axios.get(labelsUrl), axios.get(dataUrl)])
          .then(response => {
            this.loadFileMetadata(response, boundingBox, wavesurfer, wavesurferMethods);
          })
          .catch(error => {
            console.error(error);
            this.setState({
              isDataLoading: false
            });
          });
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isDataLoading: false
        });
      });
      console.log(this.state)
  }

  handleAlertDismiss(e) {
    e.preventDefault(e);
    this.setState({
      successMessage: '',
      errorMessage: '',
      errorUnsavedMessage: ''
    });
  }

  loadRegions(regions) {
    const { wavesurfer } = this.state;
    regions.forEach(region => {
      region.saved = true;
      wavesurfer.addRegion(region);
    });
  }

  savePrevious() {
    let linksArray = [];
    let count = 0;
    const links = localStorage.getItem('previous_links');
    const { num_of_prev } = this.state;
    if (!links) {
      localStorage.setItem('previous_links', JSON.stringify(linksArray));
      localStorage.setItem('count', JSON.stringify(num_of_prev));
    } else {
      linksArray = JSON.parse(localStorage.getItem('previous_links'));
      count = JSON.parse(localStorage.getItem('count'));
    }
    this.setState({ previous_pages: linksArray, num_of_prev: count });
  }

  loadFileMetadata(response, boundingBox, wavesurfer, wavesurferMethods) {
    this.setState({
      isDataLoading: false,
      labels: response[0].data
    });

    const { is_marked_for_review, segmentations, filename, original_filename } = response[1].data;

    const regions = segmentations.map(segmentation => {
      if (boundingBox) {
        return {
          start: segmentation.start_time,
          end: segmentation.end_time,
          top: segmentation.max_freq,
          bot: segmentation.min_freq,
          saved: true,
          color: 'rgba(0, 0, 0, 0.7)',
          data: {
            segmentation_id: segmentation.segmentation_id,
            annotations: segmentation.annotations
          }
        };
      }
      return {
        start: segmentation.start_time,
        end: segmentation.end_time,
        saved: true,
        color: 'rgba(0, 0, 0, 0.7)',
        data: {
          segmentation_id: segmentation.segmentation_id,
          annotations: segmentation.annotations
        },
        boundingBox
      };
    });

    this.setState({
      isDataLoading: false,
      isMarkedForReview: is_marked_for_review,
      original_filename
    });

    wavesurfer.load(`/audios/${filename}`);
    const { zoom } = this.state;
    wavesurfer.zoom(zoom);

    this.setState({ wavesurfer, wavesurferMethods });
    this.loadRegions(regions);
  }

  loadNextData(response) {
    const { projectId, path } = this.state;
    const { active, next_page } = response.data;
    this.setState({
      data: response.data.data
    });

    let apiUrl2 = `/api/current_user/projects/${projectId}/data`;
    apiUrl2 = `${apiUrl2}?page=${next_page}&active=${active}`;

    axios({
      method: 'get',
      url: apiUrl2
    })
      .then(message => {
        const { data } = message.data;
        const next_data_url = `${path}/projects/${projectId}/data/${data[0].data_id}/annotate`;
        this.setState({
          next_data_url,
          next_data_id: data[0].data_id
        });
      })
      .catch(error => {
        this.setState({
          errorMessage: error.message.data.message
        });
      });
  }

  nextPage(nextDataId) {
    const {wavesurfer, projectId} = this.state
    console.log(nextDataId)
    let newState =  this.initalState
    newState["labelsUrl"] =  `/api/projects/${projectId}/labels`
    newState["dataUrl"] = `/api/projects/${projectId}/data/${nextDataId}`
    newState["segmentationUrl"] =  `/api/projects/${projectId}/data/${nextDataId}/segmentations`
    newState["dataId"] = nextDataId
    console.log(newState)
    this.setState(newState, () => {
      wavesurfer.destroy()
      this.componentDidMount()
    })
  }

  changePlayback(e) {
    this.setState({playbackRate: e.target.value})
  }

  render() {
    const {
      isDataLoading,
      errorMessage,
      errorUnsavedMessage,
      successMessage,
      isRendering,
      original_filename,
      wavesurferMethods,
      navButtonsEnabled,
      referenceWindowOn,
      projectId,
      toUnsavedClipOn,
      spectrogramDemoOn,
      spectrogram,
      playbackRate
    } = this.state;
    if (wavesurferMethods) {
      wavesurferMethods.updateState(this.state);
    }
    return (
      <div  style={{overflow: "hidden"}}>
        <Helmet>
          <title>Annotate</title>
        </Helmet>
        <div className="container h-100">
        {spectrogramDemoOn? 
          <div>
          <input
            type="range"
            min="-1"
            max="1"
            value={playbackRate}
            onChange={(e) => {this.changePlayback(e); spectrogram.brightness(e.target.value)}}
          />
          <Button
            size="lg"
            type="danger"
            onClick={e => spectrogram.copy()}
            text="test"
          /> 
          </div>: null}
          <div className="h-100 mt-5 text-center">
            <AlertSection
              messages={[
                { message: errorUnsavedMessage, type: 'danger' },
                { message: errorMessage, type: 'danger' },
                { message: successMessage, type: 'success' }
              ]}
              overlay
              callback={e => this.handleAlertDismiss(e)}
            />
            {!isRendering && <div id="filename">{original_filename}</div>}

            <RenderingMsg isRendering={isRendering} />
            <Spectrogram isRendering={isRendering} />
            {!isRendering ? (
              <div>
                <LabelSection state={this.state} annotate={this} labelRef={this.labelRef} />
                <div className={isDataLoading ? 'hidden' : ''}>
                  <LabelButton state={this.state} annotate={this} />
                  <MarkedForReview state={this.state} annotate={this} />
                  <ChangePlayback annotate={this} />
                  {navButtonsEnabled && <NavButton annotate={this} />}
                  <PreviousAnnotationButton annotate={this} />
                  {toUnsavedClipOn && this.UnsavedButton ? this.UnsavedButton.render() : null}
                  {referenceWindowOn? <ReferenceWindow annotate={this} projectId={projectId}/> : console.log("no render")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Annotate);
