import axios from 'axios';
import React from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';

import setAuthorizationToken from '../utils';

/**
 * Render navbuttons in top of webpage on all pages
 */
class NavBar extends React.Component {
  
  /**
   * Handler for when the user logsout
   */
  handleLogout() {
    const { history, store } = this.props;

    //Send a message to backend to delete user's session id
    axios({
      method: 'delete',
      url: '/auth/logout'
    })
      .then(() => {
        //On successful login, edit local session state
        localStorage.removeItem('access_token');
        store.set('isUserLoggedIn', false);
        store.set('isAdmin', false);
        store.set('isLoading', false);

        setAuthorizationToken(null);

        history.push('/');
      })
      .catch(error => {
        //Standard error
        console.error(error);
      });
  }

  render() {
    const { store } = this.props;
    const isUserLoggedIn = store.get('isUserLoggedIn');
    const isAdmin = store.get('isAdmin');

    return (
      <nav className="navbar navbar-expand-md bg-dark navbar-dark">
        {/** Title and link to home page */}
        <Link to="/" className="navbar-brand">
          Pyrenote
        </Link>

        {/** Render the ability to expand or collpase nav bar if there isn't enough space */}
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#collapsibleNavbar"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/** 
         * Rendering dashboard + logout button (if user logged in)
         * Also renders Admin Panel link (if user is admin)
         */}
        {isUserLoggedIn && (
          <div className="collapse navbar-collapse" id="collapsibleNavbar">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">
                  Dashboard
                </Link>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <Link className="nav-link" to="/admin">
                    Admin Panel
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link btn btn-link"
                  onClick={e => this.handleLogout(e)}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    );
  }
}

export default withRouter(withStore(NavBar));
