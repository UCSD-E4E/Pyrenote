import React, { Suspense } from 'react';
import { withRouter } from "react-router-dom";
const Annotate_C = React.lazy(() => import("../components/annotate_c"));

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
