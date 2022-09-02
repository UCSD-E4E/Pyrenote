import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { errorLogger } from '../../logger';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

/**
 * Form to add or remove users from accessing a project
 * ONLY IF THE PROJECT IS NOT AN EXAMPLE
 * OTHERWISE ALL USERS HAVE ACCESS REGRAUDLESS OF WHAT IS ON THIS PAGE
 */
class ManageUsersProjectForm extends React.Component {
  constructor(props) {
    super(props);

    let { projectId } = this.props;
    const { projectName } = this.props;
    projectId = Number(projectId);

    this.initialState = {
      projectId,
      projectName,
      users: [],
      selectedUsers: [],
      errorMessage: '',
      successMessage: '',
      isLoading: false,
      isSubmitting: false,
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: '/api/users',
      updateUsersProject: `/api/projects/${projectId}/users`
    };

    this.state = { ...this.initialState };
  }

  /**
   * Get list of users currently on that project
   * Get a list of all users too
   * This way we know what users are on a project and which are not
   */
  componentDidMount() {
    const { projectUrl, getUsersUrl } = this.state;

    this.setState({ isLoading: true });

    //make two requests to get list of current project users, and a list of all users
    axios.all([axios.get(projectUrl), axios.get(getUsersUrl)]).then(response => {
      //save all users that are currently selected
      const selectedUsers = response[0].data.users.map(user => Number(user.user_id));
      //and a list of all users
      this.setState({
        selectedUsers,
        users: response[1].data.users,
        isLoading: false
      });
    });
  }

  /**
   * When a user selects a new user to add or remove
   * Update the local array of stored seleced users for that project. 
   * @param {*} e 
   * @returns 
   */
  handleUsersChange(e) {
    //get currently selected users
    const { selectedUsers } = this.state;

    //Create an array with one element in it containing the user that was just selected
    //(DOUBLE CHECK THIS IS TRUE)
    const users = Array.from(e.target.selectedOptions, option => Number(option.value));

    //Determine if the user that was just selected was already assigned to that project
    for (let i = 0; i < selectedUsers.length; i++) {

      //if so, that user must be removed by the admin
      if (selectedUsers[i] === users[0]) {
        //update list to remove that one element
        selectedUsers.splice(i, 1);
        this.setState({ selectedUsers });
        return;
      }
    }

    //Otherwise, that user was not previously selected
    //Therefore we should combine the two arrays together
    //to add that new user to selectedUsers
    const array = selectedUsers.concat(users);
    this.setState({ selectedUsers: array });
  }

  /**
   * Update the backend with a new list of users approved to access
   * that project
   * @param {*} e 
   * @returns 
   */
  handleManageUsersProject(e) {
    e.preventDefault();
    this.setState({ isSubmitting: true });
    const { selectedUsers, updateUsersProject } = this.state;

    //Handle edge case where there is no users selected
    if (!selectedUsers || !Array.isArray(selectedUsers)) {
      this.setState({
        isSubmitting: false,
        errorMessage: 'Please select users!',
        successMessage: ''
      });
      return;
    }

    //Send the backend the new list of selectedUsers who can access that project
    axios({
      method: 'patch',
      url: updateUsersProject,
      data: {
        users: selectedUsers
      }
    })
      .then(response => {
        this.setState({
          isSubmitting: false,
          successMessage: response.data.message,
          errorMessage: null
        });
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message);
        this.setState({
          isSubmitting: false,
          errorMessage: error.response.data.message,
          successMessage: ''
        });
      });
  }

  /**
   * Standard alert dismiss
   * @param {*} e 
   */
  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  //TODO: checked if this needs to be removed
  resetState() {
    this.setState(this.initialState);
  }

  /**
   * Render the modal for updating users
   * @returns 
   */
  render() {
    const { isSubmitting, errorMessage, successMessage, users, selectedUsers, isLoading } =
      this.state;
    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <form
            className="col-6"
            name="manage_users"
            ref={el => {
              this.form = el;
            }}
          >
            {/** FORM ALERTS */}
            {isLoading ? <Loader /> : null}
            <FormAlerts
              errorMessage={errorMessage}
              successMessage={successMessage}
              callback={e => this.handleAlertDismiss(e)}
            />

            {/** Here is the form for users */}
            {!isLoading ? (
              <div>
                <div className="form-group text-left font-weight-bold">
                  <label htmlFor="users">Users</label>
                  <select
                    className="form-control"
                    name="users"
                    id="users"
                    multiple
                    size="10"
                    value={selectedUsers}
                    onChange={e => this.handleUsersChange(e)}
                  >
                    {/** list of users selcted here */}
                    {users.map((user, index) => {
                      return (
                        <option value={user.user_id} key={index}>
                          {user.username}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/** Submission button */}
                <div className="form-row">
                  <div className="form-group col">
                    <Button
                      size="lg"
                      type="primary"
                      disabled={isSubmitting}
                      onClick={e => this.handleManageUsersProject(e)}
                      isSubmitting={isSubmitting}
                      alt="Save"
                      text="Save"
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

export default withStore(withRouter(ManageUsersProjectForm));
