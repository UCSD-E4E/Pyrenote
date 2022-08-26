import React from 'react';
import { Button } from '../components/button';
import CreateUserForm from '../containers/forms/createUserForm';

/**
 * React component for rendering the signup user page
 * This handles the user being able to sign up for an account without
 * admin access
 */
class CreateUser extends React.Component {

  /**
   * Sends the user back to the main webpage
   */
  goBack() {
    const index = window.location.href.indexOf('/newUser');
    const path = window.location.href.substring(0, index);
    window.location.href = path;
  }

  /**
   * Render the sign up now web page
   * @returns html
   */
  render() {
    return (
      <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <CreateUserForm authNeeded="false" />
          <Button size="lg" type="primary" onClick={e => this.goBack(e)} text="Go back to Login" />
        </div>
      </div>
    );
  }
}

export default CreateUser;
