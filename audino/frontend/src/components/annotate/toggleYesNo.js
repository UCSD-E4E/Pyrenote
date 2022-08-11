import React from 'react';
import axios from 'axios';
import { Button } from '../button';

class ToggleYesNo extends React.Component {
  constructor(params) {
    super(params);
    this.annotate = params.annotate;
    const { state } = this.annotate;
    const { projectID, dataID, dataUrl, isMarkedForReview } = state;
    this.projectID = projectID;
    this.dataID = dataID;
    this.dataUrl = dataUrl;
    this.state = {
      yes: isMarkedForReview
    };
  }

  componentDidMount() {}

  handleClick(type) {
    let newState = null;
    if (type === 'yes') newState = { yes: true };
    else newState = { yes: false };
    this.setState(newState);
    this.annotate.setState({ isMarkedForReviewLoading: true });

    axios({
      method: 'patch',
      url: this.dataUrl,
      data: {
        is_marked_for_review: !newState.yes
      }
    })
      .then(response => {
        this.annotate.setState({
          isMarkedForReviewLoading: false,
          isMarkedForReview: response.data.is_marked_for_review,
          errorMessage: null,
          successMessage: 'Marked for review status changed'
        });
      })
      .catch(error => {
        console.error(error);
        this.annotate.setState({
          isDataLoading: false,
          errorMessage: 'Error changing review status',
          successMessage: null
        });
      });
  }

  render() {
    const { yes } = this.state;
    let msg = ': ';
    if (yes) msg = ': Yes';
    else msg = ': No';
    return (
      <div className="row justify-content-center my-4">
        <div className="col-4">
          <Button
            text={`Feeling Confident In \n your labels?${msg}`}
            size="lg"
            type={yes ? 'primary' : 'danger'}
            onClick={() => this.handleClick(yes ? 'No' : 'Yes')}
          />
        </div>
      </div>
    );
  }
}

export default ToggleYesNo;
