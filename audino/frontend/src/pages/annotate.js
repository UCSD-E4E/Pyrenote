/* eslint "no-nested-ternary": "off" */
import React from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import {
  faBackward,
  faForward,
  faPlayCircle,
  faPauseCircle,
} from "@fortawesome/free-solid-svg-icons";
import WaveSurfer from "../wavesurfer.js/src/wavesurfer.js";
import RegionsPlugin from "../wavesurfer.js/src/plugin/regions/index.js";
import SpectrogramPlugin from "../wavesurfer.js/src/plugin/spectrogram/index.js";
import Alert from "../components/alert";
import { IconButton, Button } from "../components/button";
import Loader from "../components/loader";

const colormap = require("colormap");
/**
 * Useful object paths:
 * wavesurfer.spectrogram.canvas
 * wavesurfer.spectrogram.wrapper
 * wavesurfer.drawer
 * wavesurfer.regions.list
 */

class Annotate extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.projectid);
    const dataId = Number(match.params.dataid);
    this.state = {
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
      isMarkedForReview: false,
      selectedSegment: null,
      isSegmentDeleting: false,
      errorMessage: null,
      errorUnsavedMessage: null,
      successMessage: null,
      isRendering: true,
      data: [],
      previous_pages: [],
      num_of_prev: 0,
    };
    this.lastTime = 0;
    this.labelRef = {};
    this.transcription = null;
  }

  componentDidMount() {
    this.lastTime = Date.now();
    let linksArray = [];
    let count = 0;
    const links = localStorage.getItem("previous_links");
    const { num_of_prev, dataId, projectId } = this.state;
    if (!links) {
      localStorage.setItem("previous_links", JSON.stringify(linksArray));
      localStorage.setItem("count", JSON.stringify(num_of_prev));
    } else {
      linksArray = JSON.parse(localStorage.getItem("previous_links"));
      count = JSON.parse(localStorage.getItem("count"));
    }
    this.setState({ previous_pages: linksArray, num_of_prev: count });

    const apiUrl = `/api/current_user/unknown/projects/${projectId}/data/${dataId}`;

    axios({
      method: "get",
      url: apiUrl,
    })
      .then((response) => {
        const { active, next_page } = response.data;
        this.setState({
          data: response.data.data,
        });

        let { next_data_url } = this.state;
        let apiUrl2 = `/api/current_user/projects/${projectId}/data`;
        apiUrl2 = `${apiUrl2}?page=${next_page}&active=${active}`;

        axios({
          method: "get",
          url: apiUrl2,
        })
          .then((message) => {
            const { data } = message.data;
            next_data_url = `/projects/${projectId}/data/${data[0].data_id}/annotate`;
            const index = window.location.href.indexOf("/projects");
            const path = window.location.href.substring(0, index);
            this.setState({
              next_data_url: path + next_data_url,
              next_data_id: data[0].data_id,
            });
          })
          .catch((error) => {
            this.setState({
              errorMessage: error.message.data.message,
            });
          });
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.response.data.message,
          isDataLoading: false,
        });
      });

    const spectrogramColorMap = colormap({
      colormap: "hot",
      nshades: 256,
      format: "float",
    });
    const { labelsUrl, dataUrl } = this.state;
    this.setState({ isDataLoading: true });
    const fftSamples = 512;
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      barWidth: 0,
      barHeight: 0,
      height: fftSamples / 2,
      width: "100%",
      barGap: null,
      mediaControls: false,
      fillParent: true,
      scrollParent: true,
      visualization: "invisible", // spectrogram //invisable
      minPxPerSec: 100,
      maxCanvasWidth: 5000000, // false,
      plugins: [
        SpectrogramPlugin.create({
          fftSamples,
          position: "relative",
          container: "#wavegraph",
          labelContainer: "#waveform-labels",
          labels: true,
          scrollParent: true,
          colorMap: spectrogramColorMap,
        }),
        RegionsPlugin.create(),
      ],
    });
    this.showSegmentTranscription(null);
    const { history } = this.props;
    history.listen(() => {
      wavesurfer.stop();
    });
    wavesurfer.on("ready", () => {
      const screenSize = window.screen.width;
      if (
        screenSize >
        wavesurfer.getDuration() * wavesurfer.params.minPxPerSec
      ) {
        wavesurfer.zoom(screenSize / wavesurfer.getDuration());
        wavesurfer.spectrogram._onUpdate(screenSize);
      }
      this.state.isRendering = false;
      this.setState({ isRendering: false });
      wavesurfer.enableDragSelection({ color: "rgba(0, 102, 255, 0.3)" });
    });
    wavesurfer.on("region-updated", (region) => {
      this.handlePause();
      region.style(region.element, {
        backgroundColor: "rgba(0, 102, 255, 0.3)",
      });
      region._onUnSave();
    });

    wavesurfer.on("region-created", (region) => {
      this.handlePause();
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
    /* wavesurfer.on('region-play', r => {
      r.once('out', () => {
        console.log('pausing on out');
      });
    }); */

    wavesurfer.on("region-click", (r, e) => {
      e.stopPropagation();
      this.setState({
        isPlaying: true,
        selectedSegment: r,
      });
      r.play();
    });
    wavesurfer.on("pause", () => {
      this.setState({ isPlaying: false });
    });

    axios
      .all([axios.get(labelsUrl), axios.get(dataUrl)])
      .then((response) => {
        this.setState({
          isDataLoading: false,
          labels: response[0].data,
        });

        const {
          is_marked_for_review,
          segmentations,
          filename,
          original_filename,
        } = response[1].data;

        const regions = segmentations.map((segmentation) => {
          return {
            start: segmentation.start_time,
            end: segmentation.end_time,
            saved: true,
            color: "rgba(0, 0, 0, 0.7)",
            data: {
              segmentation_id: segmentation.segmentation_id,
              annotations: segmentation.annotations,
            },
          };
        });

        this.setState({
          isDataLoading: false,
          isMarkedForReview: is_marked_for_review,
          original_filename,
        });

        wavesurfer.load(`/audios/${filename}`);
        const { zoom } = this.state;
        wavesurfer.zoom(zoom);

        this.setState({ wavesurfer });
        this.loadRegions(regions);
      })
      .catch((error) => {
        console.error(error);
        this.setState({
          isDataLoading: false,
        });
      });
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
        console.error(error);
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
        .then(() => {
          wavesurfer.regions.list[selectedSegment.id].remove();
          this.setState({
            selectedSegment: null,
            isSegmentDeleting: false,
          });
        })
        .catch((error) => {
          console.error(error);
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

  handleSegmentSave() {
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
          selectedSegment.data.segmentation_id = response.data.segmentation_id;
          this.setState({
            isSegmentSaving: false,
            selectedSegment,
            successMessage: "Segment saved",
            errorMessage: null,
          });
          selectedSegment.style(selectedSegment.element, {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          });
          selectedSegment._onSave();
        })
        .catch((error) => {
          console.error(error);
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
        .then(() => {
          this.setState({
            isSegmentSaving: false,
            successMessage: "Segment saved",
            errorMessage: null,
          });
          selectedSegment.style(selectedSegment.element, {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          });
          selectedSegment._onSave();
        })
        .catch((error) => {
          console.error(error);
          this.setState({
            isSegmentSaving: false,
            errorMessage: "Error saving segment",
            successMessage: null,
          });
        });
    }
  }

  handleAllSegmentSave() {
    const { segmentationUrl, wavesurfer } = this.state;
    Object.values(wavesurfer.regions.list).forEach((segment) => {
      if (
        !segment.saved &&
        segment.data.annotations !== "" &&
        segment.data.annotations != null
      ) {
        try {
          const { start, end } = segment;
          const {
            transcription = "",
            annotations = "",
            segmentation_id = null,
          } = segment.data;
          this.setState({ isSegmentSaving: true });
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
              method: "post",
              url: segmentationUrl,
              data: {
                start,
                end,
                transcription,
                annotations,
                time_spent,
              },
            })
              .then((response) => {
                segment.data.segmentation_id = response.data.segmentation_id;
                this.setState({
                  isSegmentSaving: false,
                  selectedSegment: segment,
                  successMessage: "Segment saved",
                  errorMessage: null,
                });
                segment.style(segment.element, {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                });
                segment._onSave();
              })
              .catch((error) => {
                console.error(error);
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
                time_spent,
              },
            })
              .then(() => {
                this.setState({
                  isSegmentSaving: false,
                  successMessage: "Segment saved",
                  errorMessage: null,
                });
                segment.style(segment.element, {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                });
                segment._onSave();
              })
              .catch((error) => {
                console.error(error);
                this.setState({
                  isSegmentSaving: false,
                  errorMessage: "Error saving segment",
                  successMessage: null,
                });
              });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  handleTranscriptionChange(e) {
    const { selectedSegment } = this.state;
    selectedSegment.data.transcription = e.target.value;
    this.setState({ selectedSegment });
  }

  handleLabelChange(key, e) {
    const { selectedSegment, labels } = this.state;
    selectedSegment.data.annotations = selectedSegment.data.annotations || {};
    if (labels[key].type === "multiselect") {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
        values: Array.from(e.target.selectedOptions, (option) => option.value),
      };
    } else {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
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

  // Go to the next audio recording
  handleNextClip(forceNext = false) {
    this.handleAllSegmentSave();
    const {
      wavesurfer,
      previous_pages,
      num_of_prev,
      data,
      dataId,
      projectId,
      next_data_id,
      next_data_url,
    } = this.state;
    let success = true;
    Object.values(wavesurfer.regions.list).forEach((segment) => {
      if (segment.saved === false && !forceNext) {
        if (segment.data.annotations == null) {
          this.setState({
            errorUnsavedMessage:
              'There regions without a label! You can\'t leave yet! If you are sure, click "force next"',
          });
          success = false;
        }
      }
    });
    if (!success) {
      return;
    }

    if (num_of_prev < previous_pages.length - 1) {
      localStorage.setItem("count", JSON.stringify(num_of_prev + 1));
      window.location.href = previous_pages[num_of_prev + 1];
      return;
    }
    previous_pages[num_of_prev] = window.location.href;
    const next_page_num = num_of_prev + 1;
    localStorage.setItem("previous_links", JSON.stringify(previous_pages));
    localStorage.setItem("count", JSON.stringify(next_page_num));
    let newPageData = data[0];
    Object.keys(data).forEach((key) => {
      key = parseInt(key, 10);
      if (data[key].data_id === dataId) {
        try {
          newPageData = data[key + 1];
          const url = `/projects/${projectId}/data/${newPageData.data_id}/annotate`;

          /// projects
          const index = window.location.href.indexOf("/projects");
          const path = window.location.href.substring(0, index);
          window.location.href = path + url;
        } catch (z) {
          try {
            if (data[0].data_id !== next_data_id) {
              window.location.href = next_data_url;
            } else {
              throw Error("no data remains");
            }
            //
          } catch (a) {
            console.error(`frist error: ${z}`, `second error: ${a}`);
            const index = window.location.href.indexOf("/projects");
            const path = window.location.href.substring(0, index);
            window.location.href = `${path}/projects/${projectId}/data`;
          }
        }
      }
    });
  }

  // Go to previous audio recording
  handlePreviousClip(forceNext = false) {
    this.handleAllSegmentSave();
    const { wavesurfer, previous_pages, num_of_prev } = this.state;
    let success = true;
    Object.values(wavesurfer.regions.list).forEach((segment) => {
      if (segment.saved === false && !forceNext) {
        if (segment.data.annotations == null) {
          this.setState({
            errorUnsavedMessage:
              'There regions without a label! You can\'t leave yet! If you are sure, click "force previous"',
          });
          success = false;
        }
        // TODO: Change this to a modal
      }
    });
    if (!success) {
      return;
    }

    if (num_of_prev > 0) {
      const page_num = num_of_prev - 1;
      const previous = previous_pages[page_num];
      previous_pages[num_of_prev] = window.location.href;
      localStorage.setItem("previous_links", JSON.stringify(previous_pages));
      localStorage.setItem("count", JSON.stringify(page_num));
      window.location.href = previous;
    } else {
      console.warn("You have hit the end of the clips you have last seen");
    }
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

  render() {
    const {
      isPlaying,
      labels,
      isDataLoading,
      isMarkedForReview,
      selectedSegment,
      isSegmentDeleting,
      isSegmentSaving,
      errorMessage,
      errorUnsavedMessage,
      successMessage,
      isRendering,
      original_filename,
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
                  overlay
                  onClose={(e) => this.handleAlertDismiss(e)}
                />
                <Button
                  size="large"
                  type="danger"
                  disabled={isSegmentSaving}
                  onClick={() => this.handleNextClip(true)}
                  isSubmitting={isSegmentSaving}
                  text="Force Next"
                />
              </div>
            ) : errorMessage ? (
              <Alert
                type="danger"
                message={errorMessage}
                overlay
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) : successMessage ? (
              <Alert
                type="success"
                message={successMessage}
                overlay
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) : null}
            <div>{original_filename}</div>
            {isRendering && (
              <div className="row justify-content-md-center my-4">
                <text>Please wait while spectrogram renders </text>
                <Loader />
              </div>
            )}
            <div
              className="row justify-content-md-center my-4 mx-3"
              style={{ display: isRendering ? "none" : "" }}
            >
              <div
                ref={(el) => {
                  this.segmentTranscription = el;
                }}
              />
              <div id="waveform-labels" style={{ float: "left" }} />
              <div id="wavegraph" style={{ float: "left" }} />
              <div id="waveform" style={{ float: "left" }} />
              <div id="timeline" />
            </div>

            <div className={isDataLoading ? "hidden" : ""}>
              <div className="row justify-content-center my-4">
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

              <div>
                {selectedSegment && (
                  <>
                    <div className="row justify-content-center my-4">
                      {Object.entries(labels).map(([key, value], index) => {
                        if (!value.values.length) {
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
                              multiple={value.type === "multiselect"}
                              value={
                                (selectedSegment &&
                                  selectedSegment.data.annotations &&
                                  selectedSegment.data.annotations[key] &&
                                  selectedSegment.data.annotations[key]
                                    .values) ||
                                (value.type === "multiselect" ? [] : "")
                              }
                              onChange={(e) => this.handleLabelChange(key, e)}
                              ref={(el) => {
                                this.labelRef[key] = el;
                              }}
                            >
                              {value.type !== "multiselect" ? (
                                <option value="-1">Choose Label Type</option>
                              ) : null}
                              {value.values.map((val) => {
                                return (
                                  <option
                                    key={val.value_id}
                                    value={`${val.value_id}`}
                                  >
                                    {val.value}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="row justify-content-center my-4">
                  {selectedSegment && (
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
                  )}
                  <div className="col-2">
                    <Button
                      size="lg"
                      type="primary"
                      onClick={(e) => this.handleAllSegmentSave(e)}
                      text="Save All"
                    />
                  </div>
                </div>
              </div>

              <div className="row justify-content-center my-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isMarkedForReview"
                    value
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
              <div className="previous">
                <Button
                  size="lg"
                  type="primary"
                  disabled={isSegmentSaving}
                  onClick={() => this.handlePreviousClip()}
                  isSubmitting={isSegmentSaving}
                  text="Previous"
                />
              </div>
              <div className="next">
                <Button
                  size="lg"
                  type="primary"
                  disabled={isSegmentSaving}
                  onClick={() => this.handleNextClip()}
                  isSubmitting={isSegmentSaving}
                  text="Next"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Annotate);
