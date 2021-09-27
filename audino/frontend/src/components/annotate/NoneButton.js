import React from 'react';
import axios from 'axios';
import { Button } from '../button';
import { handleAllSegmentSave } from '../../pages/annotatefunctions';

const NoneButton = props => {
  const { annotate } = props;

  const submitNewLabel = () => {
      const { segmentationUrl, wavesurfer, wavesurferMethods, projectId, dataId } = annotate.state;
        try {
          const now = Date.now();
          let time_spent = 0;
          time_spent = now - annotate.lastTime;
          console.log(annotate.state.wavesurfer.regions)
          
            axios({
              method: 'post',
              url:    `/api/projects/${projectId}/data/${dataId}/no-label`,
              data: {
                time_spent
              }
            })
              .then(response => {
                const region = annotate.state.wavesurfer.regions.add({
                  start: 0,
                  end: response.data.end_time,
                  color: 'rgba(0, 0, 0, 0.7)'
                })
                annotate.setState({selectedSegment: null});
                region._onSave()
                document.getElementById('next').children[0].click();
              })
              .catch(error => {
                console.error(error)
              })
        } catch (err) {
          console.error(err);
        }
      }

  return (
    <div>
          <Button
            size="lg"
            type="primary"
            onClick={() => submitNewLabel()}
            text={"No audio event"}
          />
    </div>
  );
};

export default NoneButton;
