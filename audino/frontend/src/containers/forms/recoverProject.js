import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

/**
 * Modal to cofrim if the projects should be recovered or not
 */
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

  /**
   * If the user wants to recover the projects
   * update the backend to put these projects back on main
   * 
   */
  handleProjectRecover() {
    this.setState({ isSubmitting: true });
    const { url, projectsToRecover } = this.state;

    //API request to set these projects to not be deleted
    axios({
      method: 'post',
      url,
      data: {
        project_ids: projectsToRecover
      }
    })
      .then(response => {
        if (response.status === 200) {
          //let users know api request was successful
          this.setState({
            isLoading: false,
            isSubmitting: false,
            successMessage: 'Projects have been recovered',
            errorMessage: null
          });

          //admin portal handlers to get rid of newly recovered projects from
          //list of deleted projects
          this.clearProjectsToRecover();
          this.onRecover();
        }
      })
      .catch(error => {
        //handle any werid errors
        errorLogger.sendLog(error.response.data.message);
        this.setState({
          errorMessage: error,
          successMessage: null,
          isSubmitting: false
        });
      });
  }

  /**
   * Dismiss Alerts
   * @param {*} e 
   */
  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  /**
   * Display render of modal
   * @returns 
   */
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
