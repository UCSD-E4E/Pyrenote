import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';

class CreateProjectForm extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      name: '',
      errorMessage: '',
      successMessage: '',
      isSubmitting: false
    };

    this.state = { ...this.initialState };
  }

  handleProjectNameChange(e) {
    this.setState({ name: e.target.value });
  }

  handleEnter(e) {
    if (e.key === 'Enter') {
      this.handleProjectCreation(e);
    }
  }

  handleProjectCreation(e) {
    e.preventDefault();

    this.setState({ isSubmitting: true });

    const { name } = this.state;

    if (!name || name === '') {
      this.setState({
        isSubmitting: false,
        errorMessage: 'Please enter a valid project name!',
        successMessage: null
      });
      return;
    }

    axios({
      method: 'post',
      url: '/api/projects',
      data: {
        name
      }
    })
      .then(response => {
        this.resetState();
        this.form.reset();
        if (response.status === 201) {
          this.setState({ successMessage: response.data.message });
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
            name="new_project"
            ref={el => {
              this.form = el;
            }}
          >
            <FormAlerts
              errorMessage={errorMessage}
              successMessage={successMessage}
              callback={e => this.handleAlertDismiss(e)}
            />
            <div className="form-group text-left">
              <input
                type="text"
                className="form-control"
                id="project_name"
                placeholder="Project Name"
                // autoFocus
                required
                onChange={e => this.handleProjectNameChange(e)}
                onKeyDown={e => this.handleEnter(e)}
              />
            </div>
            <div className="form-row">
              <div className="form-group col">
                <Button
                  size="lg"
                  type="primary"
                  disabled={!!isSubmitting}
                  onClick={e => this.handleProjectCreation(e)}
                  isSubmitting={isSubmitting}
                  text="Save"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(CreateProjectForm));
