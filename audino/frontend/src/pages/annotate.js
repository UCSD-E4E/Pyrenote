import axios from "axios";
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
import React, { Suspense } from 'react';
import { IconButton, Button } from "../components/button";
import Loader from "../components/loader";
import { text } from "@fortawesome/fontawesome-svg-core";
//import Annotate_C from "../components/annotate_c";
const Annotate_C = React.lazy(() => import("../components/annotate_c"));
//import Data from "./data";
//import * as data from "./data.js";
//import "./data";
let colormap = require('colormap')

class Annotate extends React.Component {
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
      isRendering: true,
      data: []
    };

    this.labelRef = {};
    this.transcription = null;
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
        <Suspense fallback={
          <div>Loading...</div>
        }>
          <Annotate_C/>
        </Suspense>
        
      </div>
    );
  }
}

export default withRouter(Annotate);
