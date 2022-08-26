/**
 * This file contains the component needed to render the Annotation web page
 * This web page requires a large number of features and is kinda complex
 * So it was broken up in 2021 into smaller pages that store simple functions/componets
 * 
 * If you are developing on anntoate page and cannot see the method you need to edit here
 * It may be that the functions you are interested are not on this page
 * 
 * Here is a list of all primary annotate functions that are stored out of this webpage
 *  - ./annotateHelpers/annotatefunctions.js
 *    - Saving segmentations
 *    - Deleting currently selected segment
 *  - ./annotateHelpers/wavesurferMethods.js
 *    - loading wavesurfer components
 *    - Setting up spectrogram, regions, and thier events handlers
 *    - Configure wavesurfer spefific events
 *    - Handle playing/Pausing/Forward/Backward buttons
 *    - Handle the zoom feature
 *    - Style colors for regions
 *    - Renders the play/pause/forward/backwards buttons
 *  - src/componets/anntotate/navbuttons.js
 *    - Renders the next and previous buttons
 * 
 * For spefifc componets being rendered in annotate, check the
 * src/componets/anntotate folder for all the extra features/side menu work
 * 
 * Contact system admins for more help understanding how annotate is organzied.
 */

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
import { handleAllSegmentSave, handleSegmentDelete } from './annotateHelpers/annotatefunctions';

class Annotate extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.projectid);
    const dataId = Number(match.params.dataid);
    const index = window.location.href.indexOf('/projects');

    //Set up the state of annotate here
    this.initialState = {
      //save data found in params
      dataId,
      projectId,
    
      //save objects containing functions to change
      //spectrogram and regions
      wavesurfer: null,
      //the currently selected region
      selectedSegment: null,

      //status messages
      errorMessage: null,
      errorUnsavedMessage: null,
      successMessage: null,

      //magic nums
      colorChange: 0,
      next_data_id: -1,
      num_of_prev: 0,
      numpage: 5,
      playbackRate: 100,
      zoom: 100,
      
      //flags
      initWavesurfer: false,
      isDataLoading: false,
      isMarkedForReview: false,
      isMarkedForReviewLoading: false,
      isPlaying: false,
      isRendering: true,
      isSegmentDeleting: false,
      
      //array storages
      labels: {},
      data: [],
      previous_pages: [],

      // URL data
      dataUrl: `/api/projects/${projectId}/data/${dataId}`,
      labelsUrl: `/api/projects/${projectId}/labels`,
      next_data_url: '',
      path: window.location.href.substring(0, index),
      segmentationUrl: `/api/projects/${projectId}/data/${dataId}/segmentations_batch`,
      
      //Extra feature flags/data
      referenceWindowOn: false,
      storedAnnotations: null,
      boundingBox: true,
      disappear: 'sideMenu',
      showActiveForm: localStorage.getItem('active') == null,
      addRegionMode: true,
      
      
      //TODO FIGURE OUT FUNCTION OF:
      direction: null,
    };
    
    //Save state
    this.state = this.initialState;
    
    //Save time to add to time_spent later
    this.lastTime = 0;

    //Refrence of labels compoennt
    this.labelRef = {};

    //Object containing method for unsaving
    this.UnsavedButton = null;
  }

  /**
   * Loads in the audio data, labels, and features toggle settings into
   * annotation page
   */
  componentDidMount() {
    //start tracking time
    this.lastTime = Date.now();

    //record current audio file as previously visted so we can access it
    //via previous button
    this.savePrevious();

    //load URL to get data from
    const { projectId, labelsUrl, dataUrl } = this.state;
    let boundingBox = null;

    //GET TOGGLE STATES OF EXTRA ANNOATE FEATURES
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/toggled`
    })
      .then(response => {
        // take all the current values of featuresList, include the new ones defined at the line 27
        
        //Get toggle state of each feature
        boundingBox = response.data.features_list['2D Labels'];
        const referenceWindowOn = response.data.features_list['reference window'];
        const applyPreviousAnnotations= response.data.features_list['auto annotate'];
        const toUnsavedClipOn= response.data.features_list['to unsaved clip'];
        const playbackOn= response.data.features_list.playbackOn;
        const spectrogramDemoOn= response.data.features_list['spectrogram demo'];
        console.log(response.data.features_list);
        
        //save toggle states in annoatate's states to enable/disable them later
        this.setState({
          navButtonsEnabled: response.data.features_list['next button'] == null || response.data.features_list['next button'],
          referenceWindowOn: response.data.features_list['reference window'],
          sideMenuOn: response.data.features_list['side menu'],
          spectrogramDemoOn, toUnsavedClipOn,
          //SideMenuEnabled is true if Tabs / Tools in Side Menu are enabled
          sideMenuEnabled: response.data.features_list['side menu']||referenceWindowOn||spectrogramDemoOn||applyPreviousAnnotations||toUnsavedClipOn||playbackOn
        });


        //Now that features are enabled, we can render in wavesurfer
        //Create the wavesurfer object via WavesurferMethods so we can prepare
        //rendering audio data
        const wavesurferMethods = new WavesurferMethods({
          annotate: this,
          state: this.state,
          boundingBox
        });
        const { wavesurfer, unsavedButton } = wavesurferMethods.loadWavesurfer();
        this.UnsavedButton = unsavedButton;

        //LOAD AUDIO FILE INTO WAVESURFER FOR RENDERING
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

  /*componentWillUnmount() {
    handleAllSegmentSave(this)
  }*/

  /**
   * Dismiss status alert
   * @param {*} e 
   */
  handleAlertDismiss(e) {
    e.preventDefault(e);
    this.setState({
      successMessage: '',
      errorMessage: '',
      errorUnsavedMessage: ''
    });
  }

  /**
   * Given a list of regions, load them into wavesurfer to render
   * @param {*} regions 
   */
  loadRegions(regions) {
    const { wavesurfer } = this.state;
    regions.forEach(region => {
      region.saved = true;
      wavesurfer.addRegion(region);
    });
  }

  /**
   * Save the current dataID so we can pull that audio file's information
   * after clicking previous
   */
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

  /**
   * Load in the audio file's metadata into wavesurfer for rendering
   * in the spectrogram and regions
   * 
   * Last step of spectrogram rendering
   * @param {*} response 
   * @param {*} boundingBox 
   * @param {*} wavesurfer 
   * @param {*} wavesurferMethods 
   */
  loadFileMetadata(response, boundingBox, wavesurfer, wavesurferMethods) {
    this.setState({
      isDataLoading: false,
      labels: response[0].data
    });

    //Get data from backend
    const { is_marked_for_review, segmentations, filename, original_filename } = response[1].data;

    //render each region saved in the backend
    const regions = segmentations.map(segmentation => {
      //bounding box allows for 8 points of movement
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
      //Otherwise just render a normal saved region
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

    //Update state
    this.setState({
      isDataLoading: false,
      isMarkedForReview: is_marked_for_review,
      original_filename
    });

    //Actually load the audio file into wavesurfer for rendering
    wavesurfer.load(`/audios/${filename}`);

    //Adjust zoom of spectrogram
    const { zoom } = this.state;
    wavesurfer.zoom(zoom);

    //Save now completed waveurfer and wavesurferMethods for possible
    //rerendering
    this.setState({ wavesurfer, wavesurferMethods });

    //Now that spectrogram is ready, load the regions on top of it
    this.loadRegions(regions);
  }

  /**
   * Load in the next audio file
   * @param {*} nextDataId of new file
   */
  nextPage(nextDataId) {
    //We want to refresh the page, without refreshing
    //this implies setting a fresh state of the wavesurfer
    const { wavesurfer, projectId } = this.state;
    const newState = this.initialState;

    //Update key aspects of the state that rely on a new DataId
    newState.labelsUrl = `/api/projects/${projectId}/labels`;
    newState.dataUrl = `/api/projects/${projectId}/data/${nextDataId}`;
    newState.segmentationUrl = `/api/projects/${projectId}/data/${nextDataId}/segmentations_batch`;
    newState.dataId = nextDataId;
    
    //We want to rerender the wavesurfer to get a new spectrogram
    newState.wavesurfer = null;
    wavesurfer.destroy();

    //Set the new state and redo start up sequence
    this.setState(newState, () => {
      this.componentDidMount();
    });
  }

  /**
   * Handle saving slider value for spectrogram color change feature
   * 
   * See audino\frontend\src\components\annotate\spectroChanger.js
   * @param {*} e 
   */
  ChangeColorChange(e) {
    this.setState({ colorChange: e.target.value });
  }

  /**
   * Handle logic for collapsing the side bar
   * 
   * See audino\frontend\src\components\sideMenu.js
   * see audino\frontend\src\components\resizerElement.js
   */
  collapseSideBar() {
    const { disappear } = this.state;

    //If the side bar is collapse, animate it so it comes back
    if (disappear === 'sideMenuDisappear') {
      this.setState({ disappear: 'sideMenu' });
      animateWidth(document.body.offsetWidth * 0.3, 0.6, 'sideMenuDisappear');

    //If the side bar is open, animate it's close
    } else {
      animateWidth(0, 0.6, 'sideMenu', () => {
        this.setState({ disappear: 'sideMenuDisappear' });
      });
    }
  }

  /**
   * Extra function to set if regions should be created or not
   * @param {} addRegionMode 
   */
  setAddRegionMode = (addRegionMode) => {
    this.setState({addRegionMode: addRegionMode})
  }

  /**
   * Renders the full annotate page
   * 
   * For Devs: Large portions of the annotate rendering is abstracted
   * See file comment for more details
   */
  render() {

    //Determine the max hight of the spectrogram
    let maxHeight;
    try {
      const leftWindow = document.getElementById("leftWindow")
      //console.log(leftWindow.scrollHeight)

      maxHeight = Math.max(777, leftWindow.scrollHeight)+ "px"
    } catch {
      maxHeight = ""
    }
    
    //Load needed state values
    const { wavesurferMethods, disappear, showActiveForm, sideMenuEnabled, sideMenuOn } =
      this.state;

    //If the wavesurferMethods exist, update it with the latest state value of annotate
    if (wavesurferMethods) {
      wavesurferMethods.updateState(this.state);
    }

    return (
      <div style={{ margin: 0, height: `${maxHeight}px`, overflow: sideMenuEnabled ? 'hidden' : "auto" }} //height: `${maxHeight}px`
      >  
        <Helmet>
          <title>Annotate</title>
        </Helmet>
        
        {/**Create modal for changing active extra feature */}
        <FormModal
          formType="SET_ACTIVE"
          title="select active"
          show={showActiveForm}
          annotate={this}
          onHide={() => this.setState({ showActiveForm: false })}
        />

        {/** Render the sidemenu + annotate portal or annotate portal */}
        {sideMenuEnabled? (
          <div className="containerAnnotate">
            {/** Render the sidemenu + annotate portal*/}
            
            {/** Render sidemenu and animation objects here*/}
            <span
              className={disappear}
              id="rightWindow"
              style={{ float: 'left', height: `${maxHeight}px`, }} //maxHeight
            >
              <SideMenu annotate={this} />
            </span>

            {/** Render resizer which can change width of side menu and collpase it*/}
            <Resizer
              annotate={this}
              isOpen={disappear !== 'sideMenuDisappear'}
              rightID="rightWindow"
              leftID="leftWindow"
              propertySwapCallabck={() => this.collapseSideBar()}
            />
            
            {/** Render annotation portal with width of total width - sidebar*/}
            <span
              className="AnnotationRegion"
              id="leftWindow"
              style={{ float: 'left', flex: '1 1 0%', marginLeft: '2%', marginRight: '2%' }}
            >
              <AnnotationWindow annotate={this} setAddRegionMode={this.setAddRegionMode} />
            </span>
          </div>
        ) : (
          <div className="container h-100">
            {/** Render annotation portal with full with and no side menu*/}
            <AnnotationWindow annotate={this} setAddRegionMode={this.setAddRegionMode} />
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Annotate);
