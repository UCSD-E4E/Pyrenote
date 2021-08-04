import React from 'react';

const MarkedForReview = props => {
  const {isMarkedForReview, isMarkedForReviewLoading} = props.state
  const annotate = props.annotate
  return (
    <div className="row justify-content-center my-4">
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="isMarkedForReview"
          value
          checked={isMarkedForReview}
          onChange={e => annotate.handleIsMarkedForReview(e)}
          disabled={isMarkedForReviewLoading}
        />
        <label className="form-check-label" htmlFor="isMarkedForReview">
          Mark for review
        </label>
      </div>
    </div>
  )
}

export default MarkedForReview





