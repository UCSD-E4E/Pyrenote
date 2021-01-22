import axios from "axios";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { createStore, withStore } from "@spyna/react-store";
import { createBrowserHistory } from "history";
import { Helmet } from "react-helmet";

import {
  Admin,
  Home,
  Dashboard,
  Error,
  Labels,
  LabelValues,
  Data,
  Database,
  CreateUser,
} from "./pages";
import NavBar from "./containers/navbar";
import createUserForm from "./containers/forms/createUserForm";
import { faWindowRestore } from "@fortawesome/free-solid-svg-icons";
import React, { Suspense } from 'react';
const Annotate = React.lazy(() => import("../src/pages/annotate"));
const history = createBrowserHistory();

const initialState = {
  username: "",
  isUserLoggedIn: null,
  isUserCreatingAccount: false,
  isAdmin: false,
  isLoading: false,
};

const PrivateRoute = withStore(({ component: Component, ...rest }) => {
  const isUserLoggedIn = rest.store.get("isUserLoggedIn");
  const isAdmin = rest.store.get("isAdmin");
  return (
    <Route
      {...rest}
      render={(props) => {
        if (isUserLoggedIn === true) {
          if (rest.location.pathname === "/admin") {
            if (isAdmin) {
              return <Component {...props} />;
            } else {
              return <Redirect to="/dashboard" />;
            }
          } else {
            return <Component {...props} />;
          }
        } else {
          return <Redirect to="/" />;
        }
      }}
    />
  );
});

const PublicRoute = withStore(({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        return <Component {...props}/>;
      }}
    />
  );
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      isUserLoggedIn: false,
      isAdmin: false,
    };
  }
 
  componentDidMount() {
    var isUserCreatingAccount = this.props.store.get("isUserCreatingAccount");
    if (window.location.href.includes("/newUser")) {
      isUserCreatingAccount = true;
    } else {
      isUserCreatingAccount = false;
      this.props.store.set("isUserCreatingAccount", false);
    }
    if (!isUserCreatingAccount) {
      var apiUrl = "/auth/is_logged_in";
      axios({
        method: "post",
        url: apiUrl
      })
        .then((response) => {
          const { is_logged_in } = response.data;
          this.props.store.set("isUserLoggedIn", is_logged_in);
          if (is_logged_in === true) {
            const { username, is_admin } = response.data;
            this.props.store.set("isAdmin", is_admin);
            this.props.store.set("username", username);
          }
          if (history.location.pathname === "/") {
            history.push("/dashboard");
          } else {
            history.push(history.location.pathname);
          }
        })
        .catch((error) => {
          if (error.response.status === 401) {
            if (history.location.pathname === "/newUser") {
              this.props.store.set("isUserCreatingAccount", true);
              history.push("/newUser");
            } else {
              history.push("/");
              this.props.store.set("isUserLoggedIn", false);
              this.props.store.set("isUserCreatingAccount", false);
            }
          }
        });
    }
    else {
      console.log("hopefully just creating a user")
      this.props.store.set("isUserCreatingAccount", true);
      this.props.store.set("isUserLoggedIn", false);
      history.push("/newUser");
      
    }
  }

  render() {
    const isUserLoggedIn = this.props.store.get("isUserLoggedIn");
    const isUserCreatingAccount = this.props.store.get("isUserCreatingAccount");

    if (isUserLoggedIn === null) {
      return null;
    }

    return (
      <Router>
        <div className="app">
          <Helmet titleTemplate="%s | audino" defaultTitle="audino"></Helmet>
          <NavBar />
          <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route
              exact
              path="/"
              render={(props) => {
                if (isUserLoggedIn === false) {
                  console.log(window.location.href)
                  if (isUserCreatingAccount && window.location.href.includes("/newUser")) {  // window.location.href.includes("/newUser")
                    return <Redirect {...props} to="/newUser"/>;
                  } else {
                    return <Home {...props} />;
                  }
                } else {
                  return <Redirect {...props} to="/dashboard" />;
                }
              }}
            />
            <PublicRoute exact path="/newUser" component={CreateUser}/>
            <Route path="/empty" component={null} key="empty" />
            <PrivateRoute exact path="/admin" component={Admin} />
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
            <PrivateRoute exact path="/database" component={Database}/>
            <PrivateRoute
              exact
              path="/projects/:id/labels"
              component={Labels}
            />
            <PrivateRoute exact path="/projects/:id/data" component={Data} />
            <PrivateRoute
              exact
              path="/projects/:projectid/data/:dataid/annotate"
              component={Annotate}
            />
            <PrivateRoute
              exact
              path="/labels/:id/values"
              component={LabelValues}
            />
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
