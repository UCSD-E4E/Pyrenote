/* eslint "no-nested-ternary": "off" */
import React from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import {AlertSection, Alert} from '../components/alert';
import WavesurferMethods from './annotateHelpers/wavesurferMethods.js';
import NavButton from '../components/annotate/navbutton';
import Spectrogram from '../components/annotate/spectrogram';
import LabelSection from '../components/annotate/labelsSection';
import LabelButton from '../components/annotate/labelButtons';
import RenderingMsg from '../components/annotate/renderingMsg';
import MarkedForReview from '../components/annotate/markedForReview';

class Annotate extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.projectid);
    const dataId = Number(match.params.dataid);
    const index = window.location.href.indexOf('/projects');

    this.state = {
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
      storedAnnotations: null,
      applyPreviousAnnotations: false,
      boundingBox: true,
      direction: null,
      initWavesurfer: false,
    };
    this.lastTime = 0;
    this.labelRef = {};
    this.UnsavedButton = null;
  }

  componentDidMount() {
    console.log("THIS RAN FRIST")
    this.lastTime = Date.now();
    let linksArray = [];
    let count = 0;
    const links = localStorage.getItem('previous_links');
    const { num_of_prev, dataId, projectId, path } = this.state;
    if (!links) {
      localStorage.setItem('previous_links', JSON.stringify(linksArray));
      localStorage.setItem('count', JSON.stringify(num_of_prev));
    } else {
      linksArray = JSON.parse(localStorage.getItem('previous_links'));
      count = JSON.parse(localStorage.getItem('count'));
    }
    this.setState({ previous_pages: linksArray, num_of_prev: count });
    const { labelsUrl, dataUrl } = this.state;
    const apiUrl = `/api/current_user/unknown/projects/${projectId}/data/${dataId}`;

    let boundingBox = null
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/toggled`
    })
      .then(response => {
        // take all the current values of featuresList, include the new ones defined at the line 27
        boundingBox = response.data.features_list['2D Labels']
        this.setState({
          navButtonsEnabled: response.data.features_list['next button'],
          applyPreviousAnnotations: response.data.features_list['auto annotate'],
          toUnsavedClipOn: response.data.features_list['to unsaved cliped'],
          playbackOn: response.data.features_list['playbackOn'],
        });
    axios({
      method: 'get',
      url: apiUrl
    })
      .then(response => {
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
      })
      .catch(error => {
        this.setState({
          errorMessage: error.response.data.message,
          isDataLoading: false
        });
      });

    const wavesurferMethods = new WavesurferMethods({ annotate: this, state: this.state, boundingBox: boundingBox });
    const {wavesurfer, unsavedButton} = wavesurferMethods.loadWavesurfer();
    this.UnsavedButton = unsavedButton;
    console.log(this.UnsavedButton)
    axios
      .all([axios.get(labelsUrl), axios.get(dataUrl)])
      .then(response => {
        this.setState({
          isDataLoading: false,
          labels: response[0].data
        });

        const { is_marked_for_review, segmentations, filename, original_filename } =
          response[1].data;

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
            boundingBox: boundingBox
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

  handleIsMarkedForReview(e) {
    const { dataUrl } = this.state;
    const isMarkedForReview = e.target.checked;
    this.setState({ isMarkedForReviewLoading: true });

    axios({
      method: 'patch',
      url: dataUrl,
      data: {
        is_marked_for_review: isMarkedForReview
      }
    })
      .then(response => {
        this.setState({
          isMarkedForReviewLoading: false,
          isMarkedForReview: response.data.is_marked_for_review,
          errorMessage: null,
          successMessage: 'Marked for review status changed'
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isDataLoading: false,
          errorMessage: 'Error changing review status',
          successMessage: null
        });
      });
  }

  // MOVING TO FUNCTIONS FILE
  handleSegmentDelete() {
    const { wavesurfer, selectedSegment, segmentationUrl } = this.state;
    this.setState({ isSegmentDeleting: true });
    if (selectedSegment.data.segmentation_id) {
      axios({
        method: 'delete',
        url: `${segmentationUrl}/${selectedSegment.data.segmentation_id}`
      })
        .then(() => {
          this.removeSegment(wavesurfer, selectedSegment);
        })
        .catch(error => {
          console.error(error);
          this.setState({
            isSegmentDeleting: false
          });
        });
    } else {
      this.removeSegment(wavesurfer, selectedSegment);
    }
  }

  // MOVING TO FUNCTIONS FILE
  handleAllSegmentSave(annotate = this) {
    const { segmentationUrl, wavesurfer, wavesurferMethods, boundingBox } = annotate.state;
    Object.values(wavesurfer.regions.list).forEach(segment => {
      if (!segment.saved && segment.data.annotations !== '' && segment.data.annotations != null) {
        try {
          let { regionTopFrequency, regionBotFrequency } = segment;
          const { start, end } = segment;
          if (!boundingBox) {
            regionTopFrequency = -1;
            regionBotFrequency = -1;
          }
          const { annotations = '', segmentation_id = null } = segment.data;
          annotate.setState({ isSegmentSaving: true });
          const now = Date.now();
          let time_spent = 0;
          if (segment.lastTime === 0) {
            time_spent = now - this.lastTime;
          } else {
            time_spent = now - segment.lastTime;
          }
          segment.setLastTime(now);
          if (segmentation_id === null) {
            axios({
              method: 'post',
              url: segmentationUrl,
              data: {
                start,
                end,
                regionTopFrequency,
                regionBotFrequency,
                annotations,
                time_spent
              }
            })
              .then(response => {
                segment.data.segmentation_id = response.data.segmentation_id;
                annotate.setState({
                  isSegmentSaving: false,
                  selectedSegment: segment,
                  successMessage: 'Segment saved',
                  errorMessage: null,
                  errorUnsavedMessage: null,
                });
                wavesurferMethods.styleRegionColor(segment, 'rgba(0, 0, 0, 0.7)');
                segment._onSave();
                this.UnsavedButton.removeSaved(segment)
              })
              .catch(error => {
                console.error(error);
                annotate.setState({
                  isSegmentSaving: false,
                  errorMessage: 'Error saving segment',
                  successMessage: null
                });
              });
          } else {
            axios({
              method: 'put',
              url: `${segmentationUrl}/${segmentation_id}`,
              data: {
                start,
                end,
                regionTopFrequency,
                regionBotFrequency,
                annotations,
                time_spent
              }
            })
              .then(() => {
                annotate.setState({
                  isSegmentSaving: false,
                  successMessage: 'Segment saved',
                  errorMessage: null
                });
                wavesurferMethods.styleRegionColor(segment, 'rgba(0, 0, 0, 0.7)');
                segment._onSave();
                this.UnsavedButton.removeSaved(segment)
              })
              .catch(error => {
                console.error(error);
                annotate.setState({
                  isSegmentSaving: false,
                  errorMessage: 'Error saving segment',
                  successMessage: null
                });
              });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  handleLabelChange(key, e) {
    const { selectedSegment, labels, wavesurferMethods } = this.state;
    selectedSegment.data.annotations = selectedSegment.data.annotations || {};
    if (e.target.value === '-1') {
      return;
    }
    if (labels[key].type === 'Multi-select') {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
        values: Array.from(e.target.selectedOptions, option => option.value)
      };
    } else {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
        values: e.target.value
      };
    }
    let storedAnnotations = selectedSegment.data.annotations
    wavesurferMethods.styleRegionColor(selectedSegment, 'rgba(0, 102, 255, 0.3)');
    this.UnsavedButton.addUnsaved(selectedSegment)
    selectedSegment._onUnSave();
    this.setState({ selectedSegment, storedAnnotations });
  }

  handleAlertDismiss(e) {
    e.preventDefault(e);
    this.setState({
      successMessage: '',
      errorMessage: '',
      errorUnsavedMessage: ''
    });
  }

  removeSegment(wavesurfer, selectedSegment) {
    wavesurfer.regions.list[selectedSegment.id].remove();
    
    if (!selectedSegment.saved)
      this.UnsavedButton.removeSaved(selectedSegment)

    this.setState({
      selectedSegment: null,
      isSegmentDeleting: false
    });
  }

  checkForSave(success, forceClip, dir) {
    const { wavesurfer } = this.state;
    this.setState({ direction: dir });
    Object.values(wavesurfer.regions.list).forEach(segment => {
      if (segment.saved === false && !forceClip) {
        if (segment.data.annotations == null) {
          this.setState({
            errorUnsavedMessage: `There regions without a label! You can't leave yet! If you are sure, click "force ${dir}"`
          });
          success = false;
        }
      }
    });
    return success;
  }

  changePlayback(e) {
    console.log(e.target.value); 
    this.state.wavesurfer.setPlaybackRate((e.target.value / 100))
    this.setState({playbackRate: e.target.value, isPlaying: true})
    console.log(this.state.isPlaying); 
  }

  loadRegions(regions) {
    const { wavesurfer } = this.state;
    regions.forEach(region => {
      region.saved = true;
      wavesurfer.addRegion(region);
    });
  }

  renderAlerts(type, message) {
    return (
      <div>
        <Alert type={type} message={message} overlay onClose={e => this.handleAlertDismiss(e)} />
      </div>
    );
  }

  render() {
    const {
      isPlaying,
      labels,
      isDataLoading,
      isMarkedForReview,
      isMarkedForReviewLoading,
      selectedSegment,
      isSegmentDeleting,
      isSegmentSaving,
      errorMessage,
      errorUnsavedMessage,
      successMessage,
      isRendering,
      original_filename,
      wavesurferMethods,
      navButtonsEnabled,
      applyPreviousAnnotations,
      toUnsavedClipOn,
      playbackRate,
      playbackOn,
    } = this.state;
    if (wavesurferMethods) {
      wavesurferMethods.updateState(this.state);
    }
    return (
      <div>
        <Helmet>
          <title>Annotate</title>
        </Helmet>
        <div className="container h-100">
          <div className="h-100 mt-5 text-center">
           
          {applyPreviousAnnotations?
              <div className="col-4">
                <Button
                  size="lg"
                  type="primary"
                  onClick={() => this.setState({applyPreviousAnnotations: !applyPreviousAnnotations})}
                  text={applyPreviousAnnotations? "apply previous annotations enabled" : "apply previous annotations disabled"}
                />
              </div> : null}
           <AlertSection messages={[
                {"message": errorUnsavedMessage, type: 'danger'},
                {"message": errorMessage, type: 'danger'},
                {"message": successMessage, type: 'success'},
              ]}
              overlay={true}
              callback={e => this.handleAlertDismiss(e)}
            />
            {!isRendering && <div>{original_filename}</div>}

            <RenderingMsg isRendering={isRendering}/>
            <Spectrogram isRendering={isRendering}/>

            {!isRendering? 
              <div>
                <LabelSection 
                  state={this.state} 
                  handleLabelChange={(key, e) => this.handleLabelChange(key, e)}
                  labelRef={this.labelRef} 
                />
                <div className={isDataLoading ? 'hidden' : ''}>
                    <LabelButton state={this.state} annotate={this}/>
                    <MarkedForReview state={this.state} annotate={this}/>
                    {playbackOn? 
                    <input
                        type="range"
                        min="1"
                        max="200"
                        value={playbackRate}
                        onChange={(e) => this.changePlayback(e)}
                      />: null }
                    {navButtonsEnabled && <NavButton save={this.handleAllSegmentSave} annotate={this}/>}
                    {toUnsavedClipOn && this.UnsavedButton? this.UnsavedButton.render() : null}
                </div> 
              </div> 
            : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Annotate);
