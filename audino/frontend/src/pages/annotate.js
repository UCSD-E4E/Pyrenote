/* eslint "no-nested-ternary": "off" */
import React from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import WavesurferMethods from './annotateHelpers/wavesurferMethods.js';
import SideMenu from '../components/sideMenu';
import { animateWidth } from '../components/annotate/animation';
import Resizer from '../components/resizerElement';
import AnnotationWindow from '../components/annotate/annotationWindow.js';
import FormModal from '../containers/modal';

class Annotate extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.projectid);
    const dataId = Number(match.params.dataid);
    const index = window.location.href.indexOf('/projects');

    this.initalState = {
      colorChange: 0,
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
      initWavesurfer: false,
      maxHeight: document.body.offsetHeight,
      disappear: 'sideMenu',
      showActiveForm: localStorage.getItem('active') == null
    };
    this.state = this.initalState;
    this.lastTime = 0;
    this.labelRef = {};
    this.UnsavedButton = null;
  }

  componentDidMount() {
    this.lastTime = Date.now();
    this.savePrevious();

    const { projectId, labelsUrl, dataUrl } = this.state;

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
          applyPreviousAnnotations: response.data.features_list['auto annotate'],
          toUnsavedClipOn: response.data.features_list['to unsaved cliped'],
          referenceWindowOn: response.data.features_list['reference window'],
          playbackOn: response.data.features_list.playbackOn,
          spectrogramDemoOn: response.data.features_list['spectrogram demo'],
          zoomOn: response.data.features_list['zoom']
        });

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
    console.log("hello?????????????????????????")
    this.setState({
      isDataLoading: false,
      labels: response[0].data,
      wavesurfer,
      wavesurferMethods
    });

    const { is_marked_for_review, segmentations, filename, original_filename, sampling_rate } = response[1].data;
    let {sampleRate} = this.state
    if (!sampleRate) {
      sampleRate = sampling_rate
    }
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
    console.log("hello?????????????????????????", this.state.wavesurfer)
    this.setState({
      isDataLoading: false,
      isMarkedForReview: is_marked_for_review,
      original_filename
    });
    console.log("hello?????????????????????????")

    console.log("start load", sampleRate)
    wavesurfer.load(`/audios/${filename}`, null, null, null, sampleRate);
    const { zoom } = this.state;
    wavesurfer.zoom(zoom);

    this.setState({ wavesurfer, wavesurferMethods, filename });
    this.loadRegions(regions);
  }

  nextPage(nextDataId) {
    const { wavesurfer, projectId } = this.state;
    const newState = this.initalState;
    newState.labelsUrl = `/api/projects/${projectId}/labels`;
    newState.dataUrl = `/api/projects/${projectId}/data/${nextDataId}`;
    newState.segmentationUrl = `/api/projects/${projectId}/data/${nextDataId}/segmentations`;
    newState.dataId = nextDataId;
    newState.wavesurfer = null;
    console.log("configed new state")
    wavesurfer.destroy();
    console.log("wavesurfer destroied")
    this.setState(newState, () => {
      this.componentDidMount();
    });
  }

  ChangeColorChange(e) {
    this.setState({ colorChange: e.target.value });
  }

  collapseSideBar() {
    const { disappear } = this.state;
    if (disappear === 'sideMenuDisappear') {
      this.setState({ disappear: 'sideMenu' });
      animateWidth(document.body.offsetWidth * 0.3, 0.6, 'sideMenuDisappear');
    } else {
      animateWidth(0, 0.6, 'sideMenu', () => {
        this.setState({ disappear: 'sideMenuDisappear' });
      });
    }
  }

  render() {
    const { wavesurferMethods, maxHeight, disappear, referenceWindowOn, showActiveForm } =
      this.state;

    if (wavesurferMethods) {
      wavesurferMethods.updateState(this.state);
    }

    return (
      <div style={{ margin: 0, height: `${maxHeight}px`, overflow: 'hidden' }}>
        <Helmet>
          <title>Annotate</title>
        </Helmet>
        <FormModal
          formType="SET_ACTIVE"
          title="select active"
          show={showActiveForm}
          annotate={this}
          onHide={() => this.setState({ showActiveForm: false })}
        />
        {referenceWindowOn ? (
          <div className="containerAnnotate">
            <span
              className={disappear}
              id="rightWindow"
              style={{ float: 'left', height: `${maxHeight}px` }}
            >
              <SideMenu annotate={this} />
            </span>

            <Resizer
              annotate={this}
              isOpen={disappear !== 'sideMenuDisappear'}
              rightID="rightWindow"
              leftID="leftWindow"
              propertySwapCallabck={() => this.collapseSideBar()}
            />

            <span
              className="AnnotationRegion"
              id="leftWindow"
              style={{ float: 'left', flex: '1 1 0%', marginLeft: '2%', marginRight: '2%' }}
            >
              <AnnotationWindow annotate={this} />
            </span>
          </div>
        ) : (
          <div className="container h-100">
            <AnnotationWindow annotate={this} />
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Annotate);
