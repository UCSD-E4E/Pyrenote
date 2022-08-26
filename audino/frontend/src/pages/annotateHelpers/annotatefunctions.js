import axios from 'axios';
import { errorLogger } from '../../logger';

/**
 * This file contains methods for saving and deleting annotations
 * These methods were added here to reduce size of the annotate file
 */

/**
 * When user presses the save all button, handle packaging and uploading annotations
 * to the backend for storage
 * 
 * This method is used in a few annotate functions
 * @param {*} annotate 
 * @param {*} callback 
 */
const handleAllSegmentSave = (annotate, callback=()=>{}) => {
  //get some prepared data for getting segmentations set up
  const { segmentationUrl, wavesurfer, wavesurferMethods } = annotate.state;

  //global vars for storainging annotations
  let segmentationData = {}
  let segmentationId = {}
  let key = 0;


  //For each annotation, package the annotation's metadata into global vars
  //Only if that annotation needs to be saved
  Object.values(wavesurfer.regions.list).forEach(segment => {
    //Do not upload annotatation if already saved or annotation has not been assigned
    if (!segment.saved && segment.data.annotations !== '' && segment.data.annotations != null) {
      
      //get the time_spent metadata for understanding user time spent annotating
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
      
      //Save sement in global vars so we can change it's id after its been saved!
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

  //Now that everything is packed away, time to save!
  //api request
  axios({
    method: 'post',
    url: segmentationUrl,
    data: {
      segmentationData
    }
  })
    .then(response => {
      //Get data for updating state of each saved segment
      let output = response.data.segmentation_data;
      try {
        //For each segment, let the user know it has been saved
        for (var key in output){
          let segment = segmentationId[key]

          //Update the segment's id if it is newly created so updates can be made to the same annotation
          segment.data.segmentation_id = output[key];

          //TODO: IS REALLY A GOOD IDEA TO CHANGE THE SLEECTEDSEGMENT FOR THIS?
          annotate.setState({
            isSegmentSaving: false,
            selectedSegment: segment,
            successMessage: 'Segment saved',
            errorMessage: null
          });

          //changed state of semgnetation to saved
          wavesurferMethods.styleRegionColor(segment, 'rgba(0, 0, 0, 0.7)');
          segment._onSave();
          annotate.UnsavedButton.removeSaved(segment);
        }
      } catch {
        //Handle error case where after saving and hitting the next button,
        //the old file will be unloaded and thus there will not be a semgentation in annotate to save
        //Hence handle this edge case
        console.log("Data couldn't be change, was it unloaded?")
        annotate.setState({
          isSegmentSaving: false,
          successMessage: null,
          errorMessage: null
        });
      }
    })
    .catch(error => {
      //general error handler
      console.error(error);
      annotate.setState({
        isSegmentSaving: false,
        errorMessage: 'Error saving segment',
        successMessage: null
      });
    });
}


// function to remove a segment from wavesurfer's list of annotations
const removeSegment = (wavesurfer, selectedSegment, annotate) => {
  wavesurfer.regions.list[selectedSegment.id].remove();
  annotate.UnsavedButton.removeSaved(selectedSegment);
  annotate.setState({
    selectedSegment: null,
    isSegmentDeleting: false
  });
};

/**
 * Delete the currently selected segment
 * @param {*} annotate object for the main annotate page
 */
const handleSegmentDelete = annotate => {
  //get objects stored in annotate class
  const { wavesurfer, selectedSegment, segmentationUrl } = annotate.state;
  annotate.setState({ isSegmentDeleting: true });

  // if the segmenet has already been saved
  // it must be deleted from sever
  if (selectedSegment.data.segmentation_id) {
    //send delete request to server
    axios({
      method: 'delete',
      url: `${segmentationUrl}/${selectedSegment.data.segmentation_id}`
    })
      .then(() => {
        //Once the data is removed on remote, remove it locally
        removeSegment(wavesurfer, selectedSegment, annotate);
      })
      .catch(error => {
        //general error handler
        console.error(error);
        annotate.setState({
          isSegmentDeleting: false
        });
      });
  } else {
    //remove data locally
    removeSegment(wavesurfer, selectedSegment, annotate);
  }
};

export { handleAllSegmentSave, handleSegmentDelete };
