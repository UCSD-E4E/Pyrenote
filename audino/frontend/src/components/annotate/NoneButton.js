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
          console.log(annotate.state.wavesurfer.regions.add({
            top: 0,
            bot: 1000,
            start: 0,
            end: 10
          }))
            axios({
              method: 'post',
              url:    `/api/projects/${projectId}/data/${dataId}/no-label`,
              data: {
                time_spent
              }
            })
              .then(response => {
                  console.log(response)
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
       <div className="buttons-container-item">
          <Button
            size="lg"
            type="primary"
            onClick={() => submitNewLabel()}
            text={"No audio event"}
          />
      </div>
    </div>
  );
};

export default NoneButton;
