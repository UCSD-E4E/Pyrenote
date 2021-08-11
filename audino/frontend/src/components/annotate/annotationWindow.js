import React from 'react';
import { AlertSection } from '../../components/alert';
import NavButton from './navbutton';
import Spectrogram from './spectrogram';
import LabelSection from './labelsSection';
import LabelButton from './labelButtons';
import RenderingMsg from './renderingMsg';
import MarkedForReview from './markedForReview';
import PreviousAnnotationButton from './extraFeatures/previousAnnotationButton';
import ChangePlayback from './extraFeatures/changePlayback';
import SpectroChanger from './spectroChanger';

const AnnotationWindow = props => {
  const { annotate } = props;
  const {state} = annotate
  const {
    isDataLoading,
    errorMessage,
    errorUnsavedMessage,
    successMessage,
    isRendering,
    original_filename,
    navButtonsEnabled,
    applyPreviousAnnotations,
    spectrogramDemoOn,
    toUnsavedClipOn,
  } = state;

  return (
    <div>
      {spectrogramDemoOn && <SpectroChanger annotate={annotate} />}
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
        {!isRendering && <div id="filename">{original_filename}</div>}

        <RenderingMsg isRendering={isRendering} />
        <Spectrogram isRendering={isRendering} />
        {!isRendering ? (
          <div>
            <LabelSection state={state} annotate={annotate} labelRef={annotate.labelRef} />
            <div className={isDataLoading ? 'hidden' : ''}>
              <LabelButton state={state} annotate={annotate} />
              <MarkedForReview state={state} annotate={annotate} />
              <ChangePlayback annotate={annotate} />
              {navButtonsEnabled && <NavButton annotate={annotate} />}
              {applyPreviousAnnotations && <PreviousAnnotationButton annotate={annotate} />}
              {toUnsavedClipOn && annotate.UnsavedButton ? annotate.UnsavedButton.render() : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AnnotationWindow;


