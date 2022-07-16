import axios from 'axios';
import { errorLogger } from '../logger';

const handleAllSegmentSave = (annotate, callback=()=>{}) => {
  const { segmentationUrl, wavesurfer, wavesurferMethods } = annotate.state;

  let segmentationData = {}
  let segmentationId = {}
  let key = 0;

  Object.values(wavesurfer.regions.list).forEach(segment => {
    if (!segment.saved && segment.data.annotations !== '' && segment.data.annotations != null) {
      const { start, end, regionTopFrequency, regionBotFrequency } = segment;
      const { annotations = '', segmentation_id = null } = segment.data;
      annotate.setState({ isSegmentSaving: true });
      const now = Date.now();
      let time_spent = 0;
      if (segment.lastTime === 0) {
        time_spent = now - annotate.lastTime;
      } else {
        time_spent = now - segment.lastTime;
      }
      
      //Create a segmentationData to add
      //Save sement so we can change it's id after its been saved!
      segmentationData[key] = {
          start,
          end,
          regionTopFrequency,
          regionBotFrequency,
          annotations,
          time_spent,
          segmentation_id
      }
      segmentationId[key] = segment

      key++;
    }
  }, key)


  console.log(segmentationData)
  console.log(segmentationUrl)

  axios({
    method: 'post',
    url: segmentationUrl,
    data: {
      segmentationData
    }
  })
    .then(response => {
      console.log(response.data.segmentation_data)

      let output = response.data.segmentation_data;
      try {
        for (var key in output){
          let segment = segmentationId[key]
          segment.data.segmentation_id = output[key];
          annotate.setState({
            isSegmentSaving: false,
            selectedSegment: segment,
            successMessage: 'Segment saved',
            errorMessage: null
          });
          wavesurferMethods.styleRegionColor(segment, 'rgba(0, 0, 0, 0.7)');
          segment._onSave();
          annotate.UnsavedButton.removeSaved(segment);
        }
      } catch {
        console.log("Data couldn't be change, was it unloaded?")
        annotate.setState({
          isSegmentSaving: false,
          successMessage: null,
          errorMessage: null
        });
      }
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

    /*
    if (!segment.saved && segment.data.annotations !== '' && segment.data.annotations != null) {
      try {
        
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
                errorMessage: null
              });
              wavesurferMethods.styleRegionColor(segment, 'rgba(0, 0, 0, 0.7)');
              segment._onSave();
              annotate.UnsavedButton.removeSaved(segment);
            })
            .catch(error => {
              console.error(error);
              annotate.setState({
                isSegmentSaving: false,
                errorMessage: 'Error saving segment',
                successMessage: null
              });
              //errorLogger.sendLog('Error saving segment');
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
              annotate.UnsavedButton.removeSaved(segment);
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
};
*/


const removeSegment = (wavesurfer, selectedSegment, annotate) => {
  wavesurfer.regions.list[selectedSegment.id].remove();
  annotate.UnsavedButton.removeSaved(selectedSegment);
  annotate.setState({
    selectedSegment: null,
   
  });
};

const handleSegmentDelete = annotate => {
  const { wavesurfer, selectedSegment, segmentationUrl } = annotate.state;
  annotate.setState({ isSegmentDeleting: true });
  if (selectedSegment.data.segmentation_id) {
    axios({
      method: 'delete',
      url: `${segmentationUrl}/${selectedSegment.data.segmentation_id}`
    })
      .then(() => {
        removeSegment(wavesurfer, selectedSegment, annotate);
      })
      .catch(error => {
        console.error(error);
        annotate.setState({
          isSegmentDeleting: false
        });
        // errorLogger.sendLog(error.data.message)
      });
  } else {
    removeSegment(wavesurfer, selectedSegment, annotate);
  }
};

const handleAllSegmentApply = annotate => {
  const {wavesurfer, selectedSegment} = annotate.state;
  Object.values(wavesurfer.regions.list).forEach(segment => {
    if (segment.data.annotations === "" || segment.data.annotations == null) {
      try {
          segment.data.annotations = selectedSegment.data.annotations;
      } catch (err) {
        console.error(err);
      }
    }
  });
};

export { handleAllSegmentSave, handleSegmentDelete, handleAllSegmentApply};
