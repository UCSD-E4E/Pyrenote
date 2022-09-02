import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';

import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';

import setAuthorizationToken from '../../utils';

/**
 * Login Form
 * Its a login form
 */
class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      usernameForm: '',
      password: '',
      isSigningIn: false,
      errorMessage: '',
      successMessage: ''
    };

    this.state = { ...this.initialState };
  }

  /**
   * save the username
   * @param {*} e 
   */
  handleUsernameChange(e) {
    this.setState({ usernameForm: e.target.value });
  }

  /**
   * Save the password
   * @param {*} e 
   */
  handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  /**
   * Upload password and username to backend for login
   * @param {*} e 
   */
  handleLoggingIn(e) {
    e.preventDefault();
    this.setState({ isSigningIn: true });

    const { usernameForm, password } = this.state;
    const { history, store } = this.props;

    //send data to backend
    axios({
      method: 'post',
      url: '/auth/login',
      data: {
        username: usernameForm,
        password
      }
    })
      .then(response => {
        //If successful, log in the uyser
        this.resetState();
        this.setState({
          successMessage: 'Logging you in...'
        });

        //set JWT access token for user auth in future api calls
        const { access_token, username, is_admin } = response.data;
        localStorage.setItem('access_token', access_token);
        setAuthorizationToken(access_token);
        
        //save user data as well
        store.set('username', username);
        store.set('isAdmin', is_admin);
        store.set('isUserLoggedIn', true);

        //send user to the dashboard
        history.push('/dashboard');
      })
      .catch(error => {
        //otherwise display error
        //if user doesn't log in right, it is handled here
        this.setState({
          isSigningIn: false,
          successMessage: '',
          errorMessage: error.response.data.message
        });
      });
  }

  /**
   * Dismiss alerts
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
   * reset the state of the form
   */
  resetState() {
    this.setState(this.initialState);
  }

  render() {
    const { isSigningIn, successMessage, errorMessage } = this.state;
    return (
      <form className="col-4" name="login">
        <FormAlerts
          errorMessage={errorMessage}
          successMessage={successMessage}
          callback={e => this.handleAlertDismiss(e)}
        />
        <h1 className="h3 mb-3 font-weight-normal">Sign in</h1>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            id="username"
            placeholder="Username"
            autoFocus
            required
            onChange={e => this.handleUsernameChange(e)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Password"
            required
            onChange={e => this.handlePasswordChange(e)}
          />
        </div>
        <div className="form-group">
          <Button
            size="lg"
            type="primary"
            disabled={!!isSigningIn}
            onClick={e => this.handleLoggingIn(e)}
            isSubmitting={isSigningIn}
            text="Login"
          />
        </div>
      </form>
    );
  }
}

export default withStore(withRouter(LoginForm));
