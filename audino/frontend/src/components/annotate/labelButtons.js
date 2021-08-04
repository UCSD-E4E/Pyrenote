import React from 'react';
import { Button } from '../button';
const LabelButton = props => {
  const {isSegmentDeleting, selectedSegment, isSegmentSaving, labels} = props.state;
  const annotate = props.annotate
  return (
    <div className="row justify-content-center my-4">
      {selectedSegment ? (<div className="col-4">
        <Button
          size="lg"
          type="danger"
          disabled={isSegmentDeleting}
          isSubmitting={isSegmentDeleting}
          onClick={e => annotate.handleSegmentDelete(e)}
          text="Delete"
        />
      </div> ) : null}
      <div className="col-4">
        <Button
          size="lg"
          type="primary"
          isSubmitting={isSegmentSaving}
          onClick={() => annotate.handleAllSegmentSave()}
          text="Save All"
        />
      </div>
    </div>
  )
}

export default LabelButton
