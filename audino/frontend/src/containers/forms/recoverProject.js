import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class RecoverProjectForm extends React.Component {
  constructor(props) {
    super(props);
    const { projectsToRecover } = this.props;
    this.clearProjectsToRecover = () => props.clearProjectsToRecover();
    this.onRecover = () => props.onRecover();
    this.initialState = {
      projectsToRecover: projectsToRecover,
      role: '-1',
      errorMessage: null,
      successMessage: null,
      isLoading: false,
      url: '/api/projects/recover_projects'
    };

    this.state = { ...this.initialState };
  }

  handleProjectRecover() {
    this.setState({ isSubmitting: true });
    const { url, projectsToRecover } = this.state;

    axios({
      method: 'post',
      url,
      data: {
        project_ids: projectsToRecover
      }
    })
      .then(response => {
        if (response.status === 200) {
          this.setState({
            isLoading: false,
            isSubmitting: false,
            successMessage: 'Projects have been recovered',
            errorMessage: null
          });
          this.clearProjectsToRecover();
          this.onRecover();
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message);
        this.setState({
          errorMessage: error,
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

  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading, projectsToRecover } = this.state;
    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <form
            className="col-6"
            name="edit_user"
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
                <h1 className="h3 mb-3 font-weight-normal">
                  Are you sure you want to recover the selected projects?
                </h1>
                <div className="form-row">
                  <div className="form-group col">
                    <Button
                      size="lg"
                      type="danger"
                      disabled={!!isSubmitting}
                      onClick={() => {
                        window.alert("Recovery Success");
                        this.handleProjectRecover();
                      }}
                      isSubmitting={isSubmitting}
                      text="YES RECOVER"
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

export default withStore(withRouter(RecoverProjectForm));
