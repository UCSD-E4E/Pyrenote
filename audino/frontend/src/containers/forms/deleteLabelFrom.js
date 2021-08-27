import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class DeleteLabelForm extends React.Component {
  constructor(props) {
    super(props);
    const { labelId } = this.props;
    this.onDelete = () => props.onDelete();
    this.initialState = {
      labelId,
      errorMessage: null,
      successMessage: null,
      isLoading: false,
      labelValueUrl: `/api/labels/${labelId}/projectId/${props.projectId}`
    };

    this.state = { ...this.initialState };
  }

  handleLabelValueUpdation(e) {
    e.preventDefault();
    const { labelValueUrl } = this.state;
    this.setState({ isSubmitting: true });
    axios({
      method: 'delete',
      url: labelValueUrl
    })
      .then(response => {
        if (response.status === 200) {
          this.setState({
            isLoading: false,
            isSubmitting: false,
            successMessage: 'Label value has been DELETED',
            errorMessage: null
          });
          /* eslint-disable */
          this.onDelete() 
          /* eslint-enable */
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message);
        this.setState({
          errorMessage: error.response.data.message,
          successMessage: null,
          isSubmitting: false
        });
      });
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  resetState() {
    this.setState(this.initialState);
  }

  clearForm() {
    this.form.reset();
  }

  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading } = this.state;

    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <form
            className="col-6"
            name="edit_label_value"
            ref={el => {
              this.form = el;
            }}
          >
            {isLoading ? <Loader /> : null}
            <FormAlerts
              errorMessage={errorMessage}
              successMessage={successMessage}
              callback={e => this.handleAlertDismiss(e)}
            />
            {!isLoading ? (
              <div>
                <div className="form-group" />
                <div className="form-row">
                  <div className="form-group col">
                    <Button
                      size="lg"
                      type="danger"
                      disabled={!!isSubmitting}
                      onClick={e => this.handleLabelValueUpdation(e)}
                      isSubmitting={isSubmitting}
                      text="DELETE LABEL CATEGORY"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(DeleteLabelForm));
