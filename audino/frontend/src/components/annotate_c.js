import axios from "axios";
import React from "react";
import WaveSurfer from "/app/frontend/src/wavesurfer.js/src/wavesurfer.js";
import RegionsPlugin from "/app/frontend/src/wavesurfer.js/src/plugin/regions/index.js"//"wavesurfer.js/dist/plugin/wavesurfer.regions.min.js"; //frontend\src\wavesurfer.js
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js";
import SpectrogramPlugin from "/app/frontend/src/wavesurfer.js/src/plugin/spectrogram/index.js";
import { Helmet } from "react-helmet";
import { withRouter } from "react-router-dom";
//import drawer from "frontend/src/pages/wavesurfer_drawer_extended.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import magma from "/app/frontend/src/colormap/colormap.min.js";
import {
  faSearchMinus,
  faSearchPlus,
  faBackward,
  faForward,
  faPlayCircle,
  faPauseCircle,
} from "@fortawesome/free-solid-svg-icons";
import Alert from "../components/alert";
import { IconButton, Button } from "../components/button";
import Loader from "../components/loader";
import { text } from "@fortawesome/fontawesome-svg-core";
//import Data from "./data";
//import * as data from "./data.js";
//import "./data";
let colormap = require('colormap')

class Annotate_C extends React.Component {
  constructor(props) {
    super(props);

    const projectId = Number(this.props.match.params.projectid);
    const dataId = Number(this.props.match.params.dataid);
    const params = new URLSearchParams(window.location.search);
    this.state = {
      active: params.get("active") || "unknown",
      page: null,
      next_page: 1,
      next_data_url: "",
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
      referenceTranscription: null,
      isMarkedForReview: false,
      selectedSegment: null,
      isSegmentDeleting: false,
      errorMessage: null,
      errorUnsavedMessage: null,
      successMessage: null,
      isRendering: false, //TODO: REMEMBER TO SET TO TRUE
      data: []
    };

    this.labelRef = {};
    this.transcription = null;
  }

  componentDidMount() {
    console.log(new Date().toLocaleString())
    let {page, active } = this.state;

    var apiUrl = `/api/current_user/unknown/projects/${this.state.projectId}/data/${this.state.dataId}`///page/${page}`
    //`/api/current_user/projects/${this.state.projectId}/data/${this.state.dataId}`///page/${page}`
    console.log(this.state.dataId)
    console.log(page)
    console.log(this.state.page)
    //TODO: figure out how to update page number here
    console.log("page number is " + page)

    axios({
      method: "get",
      url: apiUrl,
    })
      .then((response) => {
        const {
          data,
          active,
          page,
          next_page,
          prev_page,
        } = response.data;
        this.setState({
          data,
          active,
          page,
          next_page,
        });
        console.log(this.state.data)
        console.log(next_page)

      let {next_data_url, projectId } = this.state;
      var apiUrl2 = `/api/current_user/projects/${projectId}/data`
      console.log(next_page)
      console.log(active)
      apiUrl2 = `${apiUrl2}?page=${next_page}&active=${active}`;

      axios({
        method: "get",
        url: apiUrl2,
      })
        .then((response) => {
          const {
            data,
            count,
            active,
            page,
            next_page,
            prev_page,
          } = response.data;
            console.log(data)
            next_data_url = `/projects/${projectId}/data/${data[0]["data_id"]}/annotate`
            var index = window.location.href.indexOf("/projects")
            var path =  window.location.href.substring(0, index);
            console.log(path);
            console.log(path+next_data_url);
            this.setState({
              next_data_url: path+next_data_url,
              next_data_id: data[0]["data_id"]
            });
            console.log("here comes the test");
            console.log(this.state.next_data_url)
        })
        .catch((error) => {
          this.setState({
            errorMessage: error.response.data.message,
          });
        });
    })
    .catch((error) => {
      this.setState({
        errorMessage: error.response.data.message,
        isDataLoading: false,
      });
    });
      
    var spectrogramColorMap = colormap({
      /*colormap: 'jet',
      nshades: 10, //256
      format: 'hex',
      alpha: 1*/
      colormap: 'hot',
      nshades: 256,
      format: 'float'
    });
    var json = JSON.stringify(spectrogramColorMap, 2)
    const { labelsUrl, dataUrl } = this.state;
    this.setState({ isDataLoading: true });
    let fftSamples = 512
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      barWidth: 0,
      barHeight: 0,
      height: fftSamples/2,
      width: "100%",
      barGap: null,
      mediaControls: false,
      fillParent: true,
      scrollParent: true,
      visualization: "invisible", //spectrogram //invisable
      minPxPerSec: 100,
      maxCanvasWidth: 5000000, //false,
      plugins: [
        SpectrogramPlugin.create({
          //wavesurfer: wavesurfer,
          fftSamples: fftSamples, 
          position: "relative",
          container: "#wavegraph",
          labelContainer: "#waveform-labels",
          labels: true,
          scrollParent: true,
          colorMap: spectrogramColorMap,
          //pixelRatio: 1,

      }),
        RegionsPlugin.create(),
        //TimelinePlugin.create({ container: "#timeline" }),
      ],
    });
    this.showSegmentTranscription(null);
    this.props.history.listen((location, action) => {
      wavesurfer.stop();
    });
    wavesurfer.on("ready", () => {
      console.log("Wavesurfer is ready")
      console.log("zoom checks")
      console.log(wavesurfer.drawer.getWidth())
      console.log(wavesurfer.getDuration() * wavesurfer.params.minPxPerSec)
      let screenSize = window.screen.width;//window.innerWidth;
      if (screenSize > wavesurfer.getDuration() * wavesurfer.params.minPxPerSec) {
        wavesurfer.zoom(screenSize / wavesurfer.getDuration())
        console.log(wavesurfer.spectrogram)
        wavesurfer.spectrogram._onUpdate(screenSize)
      }
      console.log("zoom checks")
      this.state.isRendering = false;
      this.setState({isRendering: false})
      console.log(new Date().toLocaleString())
      //wavesurfer.drawer.canvases[0].position = 'relative';
      //document.getElementById("myBtn").style.left = "100px";
      //wavesurfer.spectrogram.wrapper =  <canvas width="1170" height="256" style="position: relative; z-index: 4; width: 1170px;"></canvas>;
      console.log(wavesurfer.spectrogram.wrapper);
      wavesurfer.enableDragSelection({ color: "rgba(0, 102, 255, 0.3)" });
    });
    wavesurfer.on("region-updated", (region) => {
      console.log("changed")
      this.handlePause();
      region.style(region.element, {backgroundColor:  "rgba(0, 102, 255, 0.3)",});
      region._onUnSave()
    });
    
    wavesurfer.on("region-created", (region) => {
      this.handlePause();
      console.log(region)
      this.setState({
        selectedSegment: region,
      });
    });
    wavesurfer.on("region-in", (region) => {
      this.showSegmentTranscription(region);
    });
    wavesurfer.on("region-out", () => {
      this.showSegmentTranscription(null);
    });
    wavesurfer.on("region-play", (r) => {
      try {
        console.log(wavesurfer.spectrogram.canvas);
      } catch {
        console.log("doesn't exists")
      }
      
      r.once("out", () => {
        //wavesurfer.play(r.start);
        console.log("pausing on out")
        //wavesurfer.pause();
      });
    });

    wavesurfer.on("region-click", (r, e) => {
      const {selectedSegment} = this.state;
      /*if (selectedSegment.saved = true) {
        region.style(region.element, {backgroundColor:  "rgba(0, 0, 0, 0.7)",});
      } else {
        region.style(region.element, {backgroundColor:  "rgba(0, 102, 255, 0.3)",});
      }*/
      e.stopPropagation();
      this.setState({
        isPlaying: true,
        selectedSegment: r,
      });
      r.play();

      console.log(r.saved)
    });
    wavesurfer.on("pause", (r, e) => {
      this.setState({ isPlaying: false });
      console.log(this.state.isPlaying);
    });

    axios
      .all([axios.get(labelsUrl), axios.get(dataUrl)])
      .then((response) => {
        this.setState({
          isDataLoading: false,
          labels: response[0].data,
        });

        const {
          reference_transcription,
          is_marked_for_review,
          segmentations,
          filename,
        } = response[1].data;

        const regions = segmentations.map((segmentation) => {
          return {
            start: segmentation.start_time,
            end: segmentation.end_time,
            data: {
              segmentation_id: segmentation.segmentation_id,
              transcription: segmentation.transcription,
              annotations: segmentation.annotations,
            },
          };
        });

        this.setState({
          isDataLoading: false,
          referenceTranscription: reference_transcription,
          isMarkedForReview: is_marked_for_review,
          filename,
        });

        wavesurfer.load(`/audios/${filename}`);
        //wavesurfer.drawBuffer();
        const { zoom } = this.state;
        wavesurfer.zoom(zoom);

        this.setState({ wavesurfer });
        this.loadRegions(regions);
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isDataLoading: false,
        });
      });
  }

  loadRegions(regions) {
    const { wavesurfer } = this.state;
    regions.forEach((region) => {
      wavesurfer.addRegion(region);
    });
  }

  showSegmentTranscription(region) {
    this.segmentTranscription.textContent =
      (region && region.data.transcription) || "–";
  }

  handlePlay() {
    const { wavesurfer } = this.state;
    this.setState({ isPlaying: true });
    wavesurfer.play();
  }

  handlePause() {
    const { wavesurfer } = this.state;
    this.setState({ isPlaying: false });
    wavesurfer.pause();
  }

  handleForward() {
    const { wavesurfer } = this.state;
    wavesurfer.skipForward(5);
  }

  handleBackward() {
    const { wavesurfer } = this.state;
    wavesurfer.skipBackward(5);
  }

  handleZoom(e) {
    const { wavesurfer } = this.state;
    const zoom = Number(e.target.value);
    wavesurfer.zoom(zoom);
    this.setState({ zoom });
  }

  handleIsMarkedForReview(e) {
    const { dataUrl } = this.state;
    const isMarkedForReview = e.target.checked;
    this.setState({ isDataLoading: true });

    axios({
      method: "patch",
      url: dataUrl,
      data: {
        is_marked_for_review: isMarkedForReview,
      },
    })
      .then((response) => {
        this.setState({
          isDataLoading: false,
          isMarkedForReview: response.data.is_marked_for_review,
          errorMessage: null,
          successMessage: "Marked for review status changed",
        });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isDataLoading: false,
          errorMessage: "Error changing review status",
          successMessage: null,
        });
      });
  }

  handleSegmentDelete() {
    const { wavesurfer, selectedSegment, segmentationUrl } = this.state;
    this.setState({ isSegmentDeleting: true });
    if (selectedSegment.data.segmentation_id) {
      axios({
        method: "delete",
        url: `${segmentationUrl}/${selectedSegment.data.segmentation_id}`,
      })
        .then((response) => {
          wavesurfer.regions.list[selectedSegment.id].remove();
          this.setState({
            selectedSegment: null,
            isSegmentDeleting: false,
          });
        })
        .catch((error) => {
          console.log(error);
          this.setState({
            isSegmentDeleting: false,
          });
        });
    } else {
      wavesurfer.regions.list[selectedSegment.id].remove();
      this.setState({
        selectedSegment: null,
        isSegmentDeleting: false,
      });
    }
  }

  handleSegmentSave(e) {
    const { selectedSegment, segmentationUrl } = this.state;
    const { start, end } = selectedSegment;

    const {
      transcription,
      annotations,
      segmentation_id = null,
    } = selectedSegment.data;

    this.setState({ isSegmentSaving: true });

    if (segmentation_id === null) {
      axios({
        method: "post",
        url: segmentationUrl,
        data: {
          start,
          end,
          transcription,
          annotations,
        },
      })
        .then((response) => {
          const { segmentation_id } = response.data;
          selectedSegment.data.segmentation_id = segmentation_id;
          this.setState({
            isSegmentSaving: false,
            selectedSegment,
            successMessage: "Segment saved",
            errorMessage: null,
          });
          selectedSegment.style(selectedSegment.element, {backgroundColor:  "rgba(0, 0, 0, 0.7)",});
          selectedSegment._onSave()
        })
        .catch((error) => {
          console.log(error);
          this.setState({
            isSegmentSaving: false,
            errorMessage: "Error saving segment",
            successMessage: null,
          });
        });
    } else {
      axios({
        method: "put",
        url: `${segmentationUrl}/${segmentation_id}`,
        data: {
          start,
          end,
          transcription,
          annotations,
        },
      })
        .then((response) => {
          this.setState({
            isSegmentSaving: false,
            successMessage: "Segment saved",
            errorMessage: null,
          });
          selectedSegment.style(selectedSegment.element, {backgroundColor:  "rgba(0, 0, 0, 0.7)",});
          selectedSegment._onSave()
        })
        .catch((error) => {
          console.log(error);
          this.setState({
            isSegmentSaving: false,
            errorMessage: "Error saving segment",
            successMessage: null,
          });
        });
    }
  }

  handleAllSegmentSave(e) {
    const { selectedSegment, segmentationUrl,wavesurfer } = this.state;
    console.log( wavesurfer.regions.list)
    for (var segment_name in wavesurfer.regions.list) {
      console.log("still running save")
      try {
        const segment =  wavesurfer.regions.list[segment_name]
        console.log( segment_name, segment);
        const { start, end } = segment;
        const {
          transcription = "",
          annotations = "",
          segmentation_id = null,
        } = segment.data;
        console.log (transcription)
        console.log(annotations)
        if (annotations === "") {
          console.log("No data, no save")
          continue;
        }
        this.setState({ isSegmentSaving: true });

        if (segmentation_id === null) {
          axios({
            method: "post",
            url: segmentationUrl,
            data: {
              start,
              end,
              transcription,
              annotations,
            },
          })
            .then((response) => {
              const { segmentation_id } = response.data;
              segment.data.segmentation_id = segmentation_id;
              this.setState({
                isSegmentSaving: false,
                selectedSegment: segment,
                successMessage: "Segment saved",
                errorMessage: null,
              });
              //segment.update({color: 'rgba(40, 40, 40, 0.7)'})
              segment.style(segment.element, {backgroundColor: "rgba(0, 0, 0, 0.7)",});
              segment._onSave()
            })
            .catch((error) => {
              console.log(error);
              this.setState({
                isSegmentSaving: false,
                errorMessage: "Error saving segment",
                successMessage: null,
              });
            });
        } else {
          axios({
            method: "put",
            url: `${segmentationUrl}/${segmentation_id}`,
            data: {
              start,
              end,
              transcription,
              annotations,
            },
          })
            .then((response) => {
              this.setState({
              isSegmentSaving: false,
              successMessage: "Segment saved",
              errorMessage: null,
            });
            segment.style(segment.element, {backgroundColor:  "rgba(0, 0, 0, 0.7)",});
            segment._onSave()
          })
          .catch((error) => {
            console.log(error);
            this.setState({
              isSegmentSaving: false,
              errorMessage: "Error saving segment",
              successMessage: null,
            });
          });
        }
      }
      catch(err) {
        console.log(err)
        continue;
      }
    }
  }

  handleTranscriptionChange(e) {
    const { selectedSegment } = this.state;
    selectedSegment.data.transcription = e.target.value;
    this.setState({ selectedSegment });
  }

  handleLabelChange(key, e) {
    const { selectedSegment, labels } = this.state;
    selectedSegment.data.annotations = selectedSegment.data.annotations || {};
    if (labels[key]["type"] === "multiselect") {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key]["label_id"],
        values: Array.from(e.target.selectedOptions, (option) => option.value),
      };
    } else {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key]["label_id"],
        values: e.target.value,
      };
    }
    this.setState({ selectedSegment });
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: "",
      errorMessage: "",
      errorUnsavedMessage: "",
    });
  }


  handleNextClip(e, forceNext=false) {
      //all possible code saved, lets continue!
      this.handleAllSegmentSave(e)
      console.log("SAVE IS GOOD LETS KEEP GOING")
      const { selectedSegment, segmentationUrl,wavesurfer } = this.state;
      for (var segment_name in wavesurfer.regions.list) {
          const segment =  wavesurfer.regions.list[segment_name]
          console.log( segment_name, segment);
          if (segment.saved == false && !forceNext) {
            if (segment.data.annotations == null) {
              this.setState({
                errorUnsavedMessage: "There regions without a label! You can't leave yet! If you are sure, click \"force next\""
              });
              return;
            }
            //TODO: Change this to a modal
          }
      }


      console.log(this.state.page)
      console.log(this.state.data)
      console.log(window.location.href);
      //TODO: FIX THIS LOGIC HERE TO ACTUALLY SET THE NEXT CLIP
      var newPageData = this.state.data[0];
      console.log("entered loop")
      for (var key in this.state.data) {
        key = parseInt(key)
        console.log(key + 1)
        if (this.state.data[key]["data_id"] == this.state.dataId) {
          console.log("exit loop")
          try {
            console.log(key + 1)
            newPageData = this.state.data[key + 1];
            console.log(newPageData);
            console.log(newPageData["data_id"]);
            var url = `/projects/${this.state.projectId}/data/${newPageData["data_id"]}/annotate`
      
            ///projects
            console.log(window.location.href.indexOf("/projects"))
            var index = window.location.href.indexOf("/projects")
            var path =  window.location.href.substring(0, index);
            console.log(path);
            console.log(path+url);
            window.location.href = path+url;
          }
          catch(e) {
            try {
              console.log("hello")
              console.log(this.state.next_data_url)
              if (this.state.data[0]["data_id"] != this.state.next_data_id) {
                window.location.href = this.state.next_data_url
              }
              else {
                throw "no data remains"
              }
              //
            } catch(e) {
              console.log("oppise " + e)
              console.log("oppise " + e)
              var index = window.location.href.indexOf("/projects")
              var path =  window.location.href.substring(0, index);
              window.location.href = path + `/projects/${this.state.projectId}/data`;
              //TODO: Implement next page logic here
            }
          }
          console.log(newPageData)
          break;
        }
      }
    //add this back TODO:
    //window.location.href = path+url;
        //href = `/projects/${this.state.projectId}/data/${newPageData["data_id"]}/annotate`
      //});
    /**try{ //TODO DELETE THIS COMMENT
          console.log(newPageData["data_id"]);
        } catch(e) {
          try {
            //attempt to use the next page
            window.location.href = this.state.next_data_url
          } catch(e) {
             //general catch here to ensure the data never crashes the app
            console.log(e)
            console.log("no more data?")
            var index = window.location.href.indexOf("/projects")
            var path =  window.location.href.substring(0, index);
            window.location.href = path;
          }
        } */
    //console.log(data.Data.state);
    //`/projects/${projectId}/data/${data["data_id"]}/annotate`
    //get data that doesn't need to be reviewed, or data that is reivewed
    //start with doesn't need to be reviewed so you can learn

    //step two: pull the id thing that the site is using to create URLS
    //step three: make url string and set window.location.href to that
    //window.location.href = "https://youtu.be/dQw4w9WgXcQ";
  }

  render() {
    const {
      zoom,
      isPlaying,
      labels,
      isDataLoading,
      isMarkedForReview,
      referenceTranscription,
      selectedSegment,
      isSegmentDeleting,
      isSegmentSaving,
      errorMessage,
      errorUnsavedMessage,
      successMessage,
      isRendering,
    } = this.state;
    return (
      <div>
        <Helmet>
          <title>Annotate</title>
        </Helmet>
        <div className="container h-100">
          <div className="h-100 mt-5 text-center">
          {errorUnsavedMessage ? (
            <div>
              <Alert
                type="danger"
                message={errorUnsavedMessage}
                onClose={(e) => this.handleAlertDismiss(e)}
              />
              <Button
                size="large"
                type="danger"
                disabled={isSegmentSaving}
                onClick={(e) => this.handleNextClip(e, true)}
                isSubmitting={isSegmentSaving}
                text="Force Next"
              />
            </div>
            ) :
            errorMessage ? (
              <Alert
                type="danger"
                message={errorMessage}
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) :
            successMessage ? (
              <Alert
                type="success"
                message={successMessage}
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) : null}
            {this.state.isRendering &&
            <div className="row justify-content-md-center my-4"> 
              <text>Please wait while spectrogram renders</text>
              <Loader/>
            </div>
            }
            <div className="row justify-content-md-center my-4" style={{display:this.state.isRendering ? "none":"" }}>
              <div ref={(el) => (this.segmentTranscription = el)}></div>
              <div id ="waveform-labels" style={{float:"left"}}></div>
              <div id ="wavegraph" style={{float:"left"}}></div>
              <div id="waveform" style={{float:"left"}}></div>
              <div id="timeline"></div> 
            </div>
            {!isDataLoading ? (
              <div>
                <div className="row justify-content-md-center my-4">
                  <div className="col-1">
                    <IconButton
                      icon={faBackward}
                      size="2x"
                      title="Skip Backward"
                      onClick={() => {
                        this.handleBackward();
                      }}
                    />
                  </div>
                  <div className="col-1">
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
                  <div className="col-1">
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
                {selectedSegment ? (
                  <div>
                    <div className="row justify-content-center my-4">
                      <div className="form-group">
                        <label className="font-weight-bold">
                          Segment Transcription
                        </label>
                        
                      </div>
                    </div>
                    <div className="row justify-content-center my-4">
                      {Object.entries(labels).map(([key, value], index) => {
                        if (!value["values"].length) {
                          return null;
                        }
                        return (
                          <div className="col-3 text-left" key={index}>
                            <label htmlFor={key} className="font-weight-bold">
                              {key}
                            </label>

                            <select
                              className="form-control"
                              name={key}
                              multiple={
                                value["type"] === "multiselect" ? true : false
                              }
                              value={
                                (selectedSegment &&
                                  selectedSegment.data.annotations &&
                                  selectedSegment.data.annotations[key] &&
                                  selectedSegment.data.annotations[key][
                                  "values"
                                  ]) ||
                                (value["type"] === "multiselect" ? [] : "")
                              }
                              onChange={(e) => this.handleLabelChange(key, e)}
                              ref={(el) => (this.labelRef[key] = el)}
                            >
                              {value["type"] !== "multiselect" ? (
                                <option value="-1">Choose Label Type</option>
                              ) : null}
                              {value["values"].map((val) => {
                                return (
                                  <option
                                    key={val["value_id"]}
                                    value={`${val["value_id"]}`}
                                  >
                                    {val["value"]}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <div className="row justify-content-center my-4">
                      <div className="col-2">
                        <Button
                          size="lg"
                          type="danger"
                          disabled={isSegmentDeleting}
                          isSubmitting={isSegmentDeleting}
                          onClick={(e) => this.handleSegmentDelete(e)}
                          text="Delete"
                        />
                      </div>
                      {/*<div className="col-2">
                        <Button
                          size="lg"
                          type="primary"
                          //disabled={isSegmentSaving}
                          onClick={(e) => this.handleSegmentSave(e)}
                          //sSubmitting={isSegmentSaving}
                          text="Save Current Segment"
                        />
                    </div>*/}
                      <div className="col-2">
                        <Button
                          size="lg"
                          type="primary"
                          //disabled={isSegmentSaving}
                          onClick={(e) => this.handleAllSegmentSave(e)}
                          //sSubmitting={isSegmentSaving}
                          text="Save All"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="row justify-content-center my-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isMarkedForReview"
                      value={true}
                      checked={isMarkedForReview}
                      onChange={(e) => this.handleIsMarkedForReview(e)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="isMarkedForReview"
                    >
                      Mark for review
                    </label>
                  </div>
                </div>
                <div className="next">
                  <Button
                    size="lg"
                    type="primary"
                    disabled={isSegmentSaving}
                    onClick={(e) => this.handleNextClip(e)}
                    isSubmitting={isSegmentSaving}
                    text="Next"
                  />
                  </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Annotate_C);
