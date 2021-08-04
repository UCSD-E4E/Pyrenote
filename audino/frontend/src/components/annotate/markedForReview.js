import React from 'react';
import axios from 'axios';

const MarkedForReview = props => {
  const { annotate, state } = props;
  const { isMarkedForReview, isMarkedForReviewLoading } = state;

  const handleIsMarkedForReview = e => {
    const { dataUrl } = annotate.state;
    const isMarkedForReview = e.target.checked;
    annotate.setState({ isMarkedForReviewLoading: true });

    axios({
      method: 'patch',
      url: dataUrl,
      data: {
        is_marked_for_review: isMarkedForReview
      }
    })
      .then(response => {
        annotate.setState({
          isMarkedForReviewLoading: false,
          isMarkedForReview: response.data.is_marked_for_review,
          errorMessage: null,
          successMessage: 'Marked for review status changed'
        });
      })
      .catch(error => {
        console.error(error);
        annotate.setState({
          isDataLoading: false,
          errorMessage: 'Error changing review status',
          successMessage: null
        });
      });
  };

  return (
    <div className="row justify-content-center my-4">
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="isMarkedForReview"
          value
          checked={isMarkedForReview}
          onChange={e => handleIsMarkedForReview(e)}
          disabled={isMarkedForReviewLoading}
        />
        <label className="form-check-label" htmlFor="isMarkedForReview">
          Mark for review
        </label>
      </div>
    </div>
  );
};

export default MarkedForReview;
