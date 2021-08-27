import React from 'react';
import { Button } from '../button';
import { handleAllSegmentSave, handleSegmentDelete } from '../../pages/annotatefunctions';

const LabelButton = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { isSegmentDeleting, selectedSegment, isSegmentSaving } = state;

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
    </div>
  );
};

export default LabelButton;
