import axios from 'axios';

import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { createStore, withStore } from '@spyna/react-store';
import { createBrowserHistory } from 'history';
import { Helmet } from 'react-helmet';

import React, { Suspense } from 'react';
import {
  Admin,
  Annotate,
  Home,
  Dashboard,
  Error,
  Labels,
  LabelValues,
  Data,
  CreateUser
} from './pages';
import NavBar from './containers/navbar';

const history = createBrowserHistory();

const initialState = {
  username: '',
  isUserLoggedIn: null,
  isUserCreatingAccount: false,
  isAdmin: false,
  isLoading: false
};

/**
 * PrivateRoutes 
 * Renders components if the url leads to that page and 
 * The user is logged in
 */
const PrivateRoute = withStore(({ component: Component, ...rest }) => {
  const isUserLoggedIn = rest.store.get('isUserLoggedIn');
  const isAdmin = rest.store.get('isAdmin');
  return (
    <Route
      {...rest}
      render={props => {
        if (isUserLoggedIn === true) {
          if (rest.location.pathname === '/admin') {
            if (isAdmin) {
              return <Component isAdmin={true} {...props} />;
            }
            return <Redirect to="/dashboard" />;
          }
          return <Component showRetired={isAdmin} {...props} />;
        }
        return <Redirect to="/" />;
      }}
    />
  );
});

/**
 * PrivateRoutes
 * Render components that anyone can access regradless of if the user is logged in or not. 
 */
const PublicRoute = withStore(({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        return <Component {...props} />;
      }}
    />
  );
});

/**
 * <App/>
 * This component takes care of all redirection work for each page
 * Handles login and logout stuff here too 
 */
class App extends React.Component {
  /**
   * Starting command for frist loading website
   * Determines if user is logged in, if they are an admin.
   * If they are logged in, they are send to the main site
   * If not they are given the login page
   * 
   * Also handles issues with server restarts and creating new users
   */
  componentDidMount() {
    const { store } = this.props;
    //Determine if the users is trying to create a new account
    let isUserCreatingAccount = store.get('isUserCreatingAccount');
    if (window.location.href.includes('/newUser')) {
      isUserCreatingAccount = true;
    } else {
      isUserCreatingAccount = false;
      store.set('isUserCreatingAccount', false);
    }
    
    //If the user is a normal user
    if (!isUserCreatingAccount) {
      const apiUrl = '/auth/is_logged_in';
      axios({
        method: 'post',
        url: apiUrl
      })
        .then(response => {
          //get if the user is logged in and save it to storage
          const { is_logged_in } = response.data;
          store.set('isUserLoggedIn', is_logged_in);

          //If the user is logged in, set thier account information
          //This way we can retrive this information locally
          if (is_logged_in === true) {
            const { username, is_admin } = response.data;
            store.set('isAdmin', is_admin);
            store.set('username', username);
          }

          //If there is no path, attempt to send the user to the dashboard
          //Otherwise just send the user to the same location they were before
          if (history.location.pathname === '/') {
            history.push('/dashboard');
          } else {
            //This case is likely in the case of a refresh or using history to go
            //back to a user
            history.push(history.location.pathname);
          }
        })
        .catch(error => {
          //If they are not quite signed in yet, there may be some other things
          //the user is trying to do
          if (error.response.status === 401) {
            //Check if the user is trying to create a new account
            if (history.location.pathname === '/newUser') {
              store.set('isUserCreatingAccount', true);
              history.push('/newUser');
            } else {
              //If they are not, push them to the main page to login
              history.push('/');
              store.set('isUserLoggedIn', false);
              store.set('isUserCreatingAccount', false);
            }
          }
          //In the case of a server reset, the redis tokens will
          //be reset, hence we will no longer recongize the user
          //requring them to sign in again
          if (error.response.status === 422) {
            localStorage.removeItem('access_token');
            history.push('/');
            store.set('isUserLoggedIn', false);
            store.set('isUserCreatingAccount', false);
          }
        });
    } else {
      //If the user is creating an account, send them to that page
      store.set('isUserCreatingAccount', true);
      store.set('isUserLoggedIn', false);
      history.push('/newUser');
    }
  }

  /**
   * Create a router to send the user everwhere in the site!
   * @returns A component containing all the possible pages that a user may go to
   */
  render() {
    const { store } = this.props;
    const isUserLoggedIn = store.get('isUserLoggedIn');
    const isUserCreatingAccount = store.get('isUserCreatingAccount');

    if (isUserLoggedIn === null) {
      return null;
    }

    return (
      <Router>
        <div className="app">
          {/* Creates top nav bar */}
          <Helmet titleTemplate="%s | Pyrenote" defaultTitle="Pyrenote" />
          <NavBar />

          {/* swtich for the diffrent pages a user may be on */}
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              {/* depending on if the user is logged in or not, send them to the starting webpages */}
              <Route
                exact
                path="/"
                render={props => {
                  if (isUserLoggedIn === false) {
                    if (isUserCreatingAccount && window.location.href.includes('/newUser')) {
                      // window.location.href.includes("/newUser")
                      return <Redirect {...props} to="/newUser" />;
                    }
                    return <Home {...props} />;
                  }
                  return <Redirect {...props} to="/dashboard" />;
                }}
              />

              {/* This section of code renders these pages when the user goes to the spefified path */}
              <PublicRoute exact path="/newUser" component={CreateUser} />
              <Route path="/empty" component={null} key="empty" />
              <PrivateRoute exact path="/admin" component={Admin} />
              <PrivateRoute exact path="/dashboard" component={Dashboard} />
              <PrivateRoute exact path="/projects/:id/labels" component={Labels} />
              <PrivateRoute exact path="/projects/:id/data" component={Data} />
              <PrivateRoute
                exact
                path="/projects/:projectid/data/:dataid/annotate"
                component={Annotate}
              />
              <PrivateRoute exact path="/labels/:id/values" component={LabelValues} />
              <Route exact path="*">
                <Error message="Page not found!" />
              </Route>
            </Switch>
          </Suspense>
        </div>
      </Router>
    );
  }
}

const connectedApp = withStore(App);

export default createStore(connectedApp, initialState);
