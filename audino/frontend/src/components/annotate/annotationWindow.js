import React from 'react';
import { useState, useEffect } from 'react'
import { AlertSection } from '../alert';
import NavButton from './navbutton';
import Spectrogram from './spectrogram';
import LabelSection from './labelsSection';
import LabelButton from './labelButtons';
import RenderingMsg from './renderingMsg';
import ToggleYesNo from './toggleYesNo';
import Button from 'react-bootstrap/Button';

const AnnotationWindow = props => {
  const { annotate, setAddRegionMode } = props;
  const { state } = annotate;
  const {
    isDataLoading,
    errorMessage,
    errorUnsavedMessage,
    successMessage,
    isRendering,
    original_filename,
    navButtonsEnabled,
  } = state;

  const [showAnnotatingRegions, setShowAnnotatingRegions] = useState(true)

  useEffect(() => {
    if (showAnnotatingRegions) {
      // set display:block to each annotating region
      let elems = document.getElementsByClassName("wavesurfer-region")
      for (let e of elems) {
        e.style.display = "block"
      }
    } else {
      // set display:none to each annotating region
      let elems = document.getElementsByClassName("wavesurfer-region")
      for (let e of elems) {
        e.style.display = "none"
      }
    }
  }, [showAnnotatingRegions])

  return (
    <div>
      <div className="h-100 mt-5 text-center">
        <AlertSection
          messages={[
            { message: errorUnsavedMessage, type: 'danger' },
            { message: errorMessage, type: 'danger' },
            { message: successMessage, type: 'success' }
          ]}
          overlay
          callback={e => annotate.handleAlertDismiss(e)}
        />
        {!isRendering && 
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{flex: 1}}></div>
            <div id="filename">{original_filename}</div>
            <div style={{display: 'flex', flex: 1, justifyContent: 'flex-end'}}>
              {
                state.addRegionMode 
                ? <Button id="add-edit-toggle-button" className="addRegion" variant="primary" onClick={() => {setAddRegionMode(!state.addRegionMode)}}>Add Regions: On</Button>
                : <Button id="add-edit-toggle-button" className="editRegion" variant="secondary" onClick={() => {setAddRegionMode(!state.addRegionMode)}}>Add Regions: Off</Button>
              }
              {
                showAnnotatingRegions
                ? <Button id="show-annotating-toggle-button" className="addRegion" variant="primary" onClick={() => {setShowAnnotatingRegions(!showAnnotatingRegions)}}>Show Annotations: On</Button>
                : <Button id="show-annotating-toggle-button" className="editRegion" variant="secondary" onClick={() => {setShowAnnotatingRegions(!showAnnotatingRegions)}}>Show Annotations: Off</Button>
              }
            </div>
          </div>
        }

        <RenderingMsg isRendering={isRendering} />
        <Spectrogram isRendering={isRendering} />
        {!isRendering ? (
          <div>
            <LabelSection state={state} annotate={annotate} labelRef={annotate.labelRef} />
            <div className={isDataLoading ? 'hidden' : ''}>
              <LabelButton state={state} annotate={annotate} />
              <ToggleYesNo annotate={annotate} />
              {navButtonsEnabled && <NavButton annotate={annotate} />}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AnnotationWindow;
