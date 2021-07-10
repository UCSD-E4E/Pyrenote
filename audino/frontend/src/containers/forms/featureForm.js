import React from "react";
import axios from "axios";
import { withRouter } from "react-router";
import { withStore } from "@spyna/react-store";

import Alert from "../../components/alert";
import FeatureChecklist from "../../components/checklist";

import { setAuthorizationToken } from "../../utils";

class FeatureForm extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      projectId: props.projectId,
      password: "",
      isSigningIn: false,
      errorMessage: "",
      successMessage: "",
      featuresEnabled: {
        "example Feature": false,
        "spectograms": false,
        "power": false,
        "banana": false,
      }
    };

    this.state = Object.assign({}, this.initialState);
  }
  
  handleSubmitFeatures(e) {
    e.preventDefault();
    this.setState({ isSigningIn: true });

    const { username, password } = this.state;
    const { history } = this.props;

    axios({
      method: "post",
      url: "/auth/login",
      data: {
        username,
        password,
      },
    })
      .then((response) => {
        this.resetState();
        this.setState({
          successMessage: "Logging you in...",
        });

        const { access_token, username, is_admin } = response.data;

        localStorage.setItem("access_token", access_token);

        setAuthorizationToken(access_token);

        this.props.store.set("username", username);
        this.props.store.set("isAdmin", is_admin);
        this.props.store.set("isUserLoggedIn", true);

        history.push("/dashboard");
      })
      .catch((error) => {
        this.setState({
          isSigningIn: false,
          successMessage: "",
          errorMessage: error.response.data.message,
        });
      });
  }

  handleCheck(value) {
    let {featuresEnabled} = this.state;
    featuresEnabled[value] = !featuresEnabled[value]
    this.setState({
      featuresEnabled
    })
    console.log(featuresEnabled)
  }

  render() {
    const { featuresEnabled } = this.state;
    return (
      <div>
          <div style={{ display: "table", justifyContent: "space-evenly", width: "100%"}}>
            <div>
              <form style={{
                float: "left",
                width: "25%"
              }}>
                {Object.entries(featuresEnabled).map(([key, value], index) => {
                 return (<FeatureChecklist item={key} isChecked={value} handleCheck={() => {this.handleCheck(key)}} />)
              })}
              </form>
            </div>
            <div>
              <form style={{
               float: "left",
               width: "25%"
              }}>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle1" name="vehicle1" value="Bike"/>
                <label for="vehicle1">&ensp;  I have a bike</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle2" name="vehicle2" value="Car"/>
                <label for="vehicle2">&ensp;  I have a car</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle3" name="vehicle3" value="Boat"/>
                <label for="vehicle3">&ensp;  I have a boat</label><br/><br/>
              </form>
            </div>
            <div>
              <form style={{
                float: "left",
                width: "25%"
              }}>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle1" name="vehicle1" value="Bike"/>
                <label for="vehicle1">&ensp;  I have a bike</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle2" name="vehicle2" value="Car"/>
                <label for="vehicle2">&ensp;  I have a car</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle3" name="vehicle3" value="Boat"/>
                <label for="vehicle3">&ensp;  I have a boat</label><br/><br/>
              </form>
            </div>
            <div>
              <form style={{
                float: "left",
                width: "25%"
              }}>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle1" name="vehicle1" value="Bike"/>
                <label for="vehicle1">&ensp;  I have a bike</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle2" name="vehicle2" value="Car"/>
                <label for="vehicle2">&ensp;  I have a car</label><br/>
                <input type="checkbox" style={{flex: "1 0 25%"}} id="vehicle3" name="vehicle3" value="Boat"/>
                <label for="vehicle3">&ensp;  I have a boat</label><br/><br/>
              </form>
            </div>
          </div>
        <input style={{position: 'relative', width: "10%",left: '45%'}} type="submit" value="Submit"/>
      </div>
    );
  }
}

export default withStore(withRouter(FeatureForm));
