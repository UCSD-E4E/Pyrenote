import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';

class EditProjectForm extends React.Component {
  constructor(props) {
    super(props);
    const { projectId } = this.props;
    this.initialState = {
      name: '',
      errorMessage: '',
      successMessage: '',
      isSubmitting: false,
      url: `/api/projects/${projectId}`,
      isMarkedExample: false
    };

    this.state = { ...this.initialState };
  }

  componentDidMount() {
    const { url } = this.state;
    axios({
      method: 'get',
      url
    })
      .then(response => {
        if (response.status === 200) {
          const { name, is_example } = response.data;
          this.setState({ name, isMarkedExample: is_example });
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message)
        this.setState({
          errorMessage: error.response.data.message,
          successMessage: null
        });
      });
  }

  handleProjectNameChange(e) {
    this.setState({ name: e.target.value });
  }

  handleMarkedExampleChange() {
    const { isMarkedExample } = this.state;
    if (isMarkedExample) {
      this.setState({ isMarkedExample: false });
    } else {
      this.setState({ isMarkedExample: true });
    }
  }

  handleProjectCreation(e) {
    e.preventDefault();

    this.setState({ isSubmitting: true });

    const { name, url, isMarkedExample } = this.state;

    axios({
      method: 'patch',
      url,
      data: {
        name,
        is_example: isMarkedExample
      }
    })
      .then(response => {
        this.setState({ successMessage: response.data.message, isSubmitting: false });
        // TODO: Decide if addition response is needed
        /* if (response.status === 200) {
          this.resetState();
          this.form.reset();
          this.setState({ successMessage: 'Successfully changed name' });
        } */
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message)
        console.error(error.response);
        this.setState({
          errorMessage: error.response.data.message,
          successMessage: '',
          isSubmitting: false
        });
      });
  }

  handleEnter(e) {
    if (e.key === 'Enter') {
      this.handleProjectCreation(e);
    }
  }

  resetState() {
    this.setState(this.initialState);
  }

  render() {
    const { isSubmitting, errorMessage, successMessage, isMarkedExample, name } = this.state;
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
                placeholder={name}
                autoFocus
                required
                onChange={e => this.handleProjectNameChange(e)}
                onKeyDown={e => this.handleEnter(e)}
              />
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isExample"
                value
                checked={isMarkedExample}
                onChange={() => this.handleMarkedExampleChange()}
                // disabled={isMarkedForReviewLoading}
              />
              <label className="form-check-label" htmlFor="isMarkedForReview">
                Mark is Example Project
              </label>
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

export default withStore(withRouter(EditProjectForm));
