import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class DeleteProjectForm extends React.Component {
  constructor(props) {
    super(props);
    const { projectsToDelete } = this.props;
    this.clearProjectsToDelete = () => props.clearProjectsToDelete();
    this.onDelete = () => props.onDelete();
    this.initialState = {
      projectsToDelete: projectsToDelete,
      role: '-1',
      errorMessage: null,
      successMessage: null,
      isLoading: false,
      url: '/api/projects/clear_projects'
    };

    this.state = { ...this.initialState };
  }

  handleProjectDelete() {
    this.setState({ isSubmitting: true });
    const { url, projectsToDelete } = this.state;

    axios({
      method: 'post',
      url,
      data: {
        project_ids: projectsToDelete
      }
    })
      .then(response => {
        if (response.status === 200) {
          this.setState({
            isLoading: false,
            isSubmitting: false,
            successMessage: 'Projects have been deleted',
            errorMessage: null
          });
        }
        this.clearProjectsToDelete();
        this.onDelete();
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
    const { isSubmitting, errorMessage, successMessage, isLoading, projectsToDelete } = this.state;
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
                  Are you sure you want to delete the selected projects?
                </h1>
                <div className="form-row">
                  <div className="form-group col">
                    <Button
                      size="lg"
                      type="danger"
                      disabled={!!isSubmitting}
                      onClick={() => {
                        window.alert("Deletion Success");
                        console.log(projectsToDelete.length);
                        this.handleProjectDelete();
                      }}
                      isSubmitting={isSubmitting}
                      text="YES DELETE"
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

export default withStore(withRouter(DeleteProjectForm));
