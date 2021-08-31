import axios from 'axios';
import React from 'react';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';

import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';

class CreateLabelValueForm extends React.Component {
  constructor(props) {
    super(props);

    const { labelId } = this.props;

    this.initialState = {
      labelId,
      value: null,
      errorMessage: '',
      successMessage: '',
      isSubmitting: false,
      files: {},
      createLabelValueUrl: `/api/labels/${labelId}/values`,
    };

    this.state = { ...this.initialState };
  }

  handleLabelValueChange(e) {
    this.setState({ value: e.target.value });
  }

  handleLabelValueCreation(e) {
    e.preventDefault();

    this.setState({ isSubmitting: true });

    const { value, createLabelValueUrl } = this.state;

    if (!value || value === '') {
      this.setState({
        isSubmitting: false,
        errorMessage: 'Please enter a valid label value!',
        successMessage: ''
      });
      return;
    }

    axios({
      method: 'post',
      url: createLabelValueUrl,
      data: {
        value
      }
    })
      .then(response => {
        if (response.status === 201) {
          this.resetState();
          this.form.reset();

          this.setState({
            successMessage: response.data.message
          });
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message);
        this.setState({
          errorMessage: error.response.data.message,
          successMessage: '',
          isSubmitting: false
        });
      });
  }

  handleUpload() {
    const {files,labelId } = this.state;
    const formData = new FormData();
    const uploadUrl = `/api/labels/${labelId}/values/file`
    const file = files[0];
    formData.append(0, file);

    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: 
        {
          'Authorization': localStorage.getItem('access_token'),
          'Content-Type': 'multipart/form-data',
        }
    }).then(response => {
      const msg = response.json();
      msg.then(data => {
        if (data.code !== 201 && data.type !== 'DATA_CREATED') {
          this.setState({
            isSubmitting: false,
            errorMessage: data.message,
            successMessage: null,
            isLoading: false
          });
          errorLogger.sendLog(data.message);
        } else {
          this.setState({
            isSubmitting: false,
            successMessage: data.message,
            errorMessage: null,
            isLoading: false,
          });
        }
      });
    });
  }
  onChangeHandler(e) {
    const files = e.target.files;
    this.setState({ files });
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

  render() {
    const { isSubmitting, errorMessage, successMessage } = this.state;
    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <form
            className="col-6"
            name="new_label_value"
            ref={el => {
              this.form = el;
            }}
          >
            <FormAlerts
              errorMessage={errorMessage}
              successMessage={successMessage}
              callback={e => this.handleAlertDismiss(e)}
            />
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                id="label_value"
                placeholder="Label Value"
                autoFocus
                required
                onChange={e => this.handleLabelValueChange(e)}
              />
            </div>
            <div className="form-row">
              <div className="form-group col">
                <Button
                  size="lg"
                  type="primary"
                  disabled={!!isSubmitting}
                  onClick={e => this.handleLabelValueCreation(e)}
                  isSubmitting={isSubmitting}
                  text="Save"
                />
              </div>
            </div>
            -----------------------------------------------------------
            <div className="form-group">
            <input
              type="file"
              name="file"
              onChange={e => {
                this.onChangeHandler(e);
              }}
              multiple
            />
            </div>
             <Button
                  size="lg"
                  type="primary"
                  disabled={!!isSubmitting}
                  onClick={e => this.handleUpload(e)}
                  isSubmitting={isSubmitting}
                  text="upload labels"
                />
          </form>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(CreateLabelValueForm));
