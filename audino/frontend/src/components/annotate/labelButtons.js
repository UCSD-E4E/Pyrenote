import React , {useState, useEffect} from 'react';
import { Button } from '../button';
import { handleAllSegmentSave, handleSegmentDelete } from '../../pages/annotatefunctions';

const LabelButton = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { isSegmentDeleting, selectedSegment, isSegmentSaving } = state;

  const [isNoAudioBtnClicked, setIsNoAudioBtnClicked] = useState(false);

  useEffect(() => {
    if (annotate.state.successMessage === "Segment saved" && isNoAudioBtnClicked) {
      console.log("clicked next after no audio button is clicked");
      document.getElementsByClassName("next")[0].getElementsByTagName('button')[0].click();
    }
  }, [annotate.state.successMessage]);

  const selectNoAudioLabel = async () => {
    setIsNoAudioBtnClicked(true);
    const waveSurfer = state.wavesurfer;
    const result = await waveSurfer.addRegion({id:"no audio", start:0, end:waveSurfer.getDuration()});
    console.log("region added"); 
    console.log(annotate);

    const noAudioLabelKey = Object.keys(annotate.state.labels)[0];
    console.log(noAudioLabelKey);
    annotate.state.labels[noAudioLabelKey].values[-1] = {value: 'No class of interest', value_id: -1};
    annotate.state.selectedSegment.data.annotations = {[noAudioLabelKey]: {label_id: 1, values: "-1"}};
    annotate.state.storedAnnotations = {[noAudioLabelKey]: {label_id: 1, values: "-1"}};

    console.log("no audio clicked");
    handleAllSegmentSave(annotate);
    
    //window.location.replace('/dashboard');
    //<Redirect to="/dashboard" /> // TODO - enter a location
    //document.getElementsByClassName("next")[0].getElementsByTagName('button')[0].click();

  }

  return (
    <div className="row justify-content-center my-4">
      {selectedSegment ? (
        <div className="col-4">
          <Button
            size="lg"
            type="danger"
            disabled={isSegmentDeleting}
            isSubmitting={isSegmentDeleting}
            onClick={() => handleSegmentDelete(annotate)}
            text="Delete"
          />
        </div>
      ) : null}
      <div className="col-4">
        <Button
          size="lg"
          type="primary"
          isSubmitting={isSegmentSaving}
          onClick={() => handleAllSegmentSave(annotate)}
          text="Save All"
        />
      </div>
      <div className="col-4">
        <Button
          size="lg"
          type="danger"
          isSubmitting={isSegmentSaving}
          onClick={() => {
            const confirmNoAudio = window.confirm("Are you sure?");
            if (confirmNoAudio) {
              selectNoAudioLabel();
            }
          }}
          text="No Relevant Audio"
        />
      </div>
    </div>
  );
};

export default LabelButton;
