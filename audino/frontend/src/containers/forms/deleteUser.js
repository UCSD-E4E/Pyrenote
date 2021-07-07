import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';

import Alert from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class DeleteUserForm extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      userId: Number(this.props.userId),
      username: '',
      role: '-1',
      errorMessage: null,
      successMessage: null,
      isLoading: false,
      url: `/api/users/${this.props.userId}`
    };

    this.state = { ...this.initialState };
  }

  componentDidMount() {
    const { url } = this.state;
    this.setState({ isLoading: true });
    axios({
      method: 'get',
      url
    })
      .then(response => {
        if (response.status === 200) {
          const { username, role_id } = response.data;
          this.setState({ username, role: String(role_id), isLoading: false });
        }
      })
      .catch(error => {
        this.setState({
          errorMessage: error.response.data.message,
          successMessage: null,
          isLoading: false
        });
      });
  }

  resetState() {
    this.setState(this.initialState);
  }

  handleRoleChange(e) {
    this.setState({ role: e.target.value });
  }

  clearForm() {
    this.form.reset();
  }

  handleUserUpdation(e) {
    e.preventDefault();

    this.setState({ isSubmitting: true });
    const { url, role } = this.state;
    axios({
      method: 'delete',
      url,
      data: {
        role
      }
    })
      .then(response => {
        if (response.status === 200) {
          const { username, role_id } = response.data;
          this.setState({
            username,
            role: String(role_id),
            isLoading: false,
            isSubmitting: false,
            successMessage: 'User has been deleted',
            errorMessage: null
          });
          this.props.onDelete();
        }
      })
      .catch(error => {
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

  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading } = this.state;
    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <form className="col-6" name="edit_user" ref={el => (this.form = el)}>
            {isLoading ? <Loader /> : null}
            {errorMessage ? (
              <Alert
                type="danger"
                message={errorMessage}
                onClose={e => this.handleAlertDismiss(e)}
              />
            ) : null}
            {successMessage ? (
              <Alert
                type="success"
                message={successMessage}
                onClose={e => this.handleAlertDismiss(e)}
              />
            ) : null}
            {!isLoading ? (
              <div>
                <h1 className="h3 mb-3 font-weight-normal">
                  Are you sure you want to delete this user?
                </h1>
                <div className="form-row">
                  <div className="form-group col">
                    <Button
                      size="lg"
                      type="primary"
                      disabled={!!isSubmitting}
                      onClick={e => this.handleUserUpdation(e)}
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

export default withStore(withRouter(DeleteUserForm));
