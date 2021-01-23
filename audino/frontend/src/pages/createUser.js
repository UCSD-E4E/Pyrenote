import axios from "axios";
import React from "react";
import { Helmet } from "react-helmet";
import { IconButton, Button } from "../components/button";
import Loader from "../components/loader";
import CreateUserForm from "../containers/forms/createUserForm";

class CreateUser extends React.Component {
  constructor(props) {
    //const { location } = this.props;
    super(props)
    this.state = {
      projects: [],
      isProjectLoading: false,
    };
  }

  /*componentDidMount() {
    this.setState({ isProjectLoading: true });

    axios({
      method: "get",
      url: "/api/current_user/projects",
    })
      .then((response) => {
        this.setState({
          projects: response.data.projects,
          isProjectLoading: false,
        });
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.response.data.message,
          isProjectLoading: false,
        });
      });
  }*/
  goBack() {
    var index = window.location.href.indexOf("/newUser")
    var path =  window.location.href.substring(0, index);
    window.location.href = path
  }
  render() {
    const { isProjectLoading, projects } = this.state;
    return (
        <div className="container h-75 text-center">
        <div className="row h-100 justify-content-center align-items-center">
          <CreateUserForm 
            authNeeded="false"
          />
          <Button
            size="lg"
            type="primary"
            onClick={(e) => this.goBack(e)}
            text="Go back to Login"
          />
        </div>
      </div>
    );
  }
}

export default CreateUser;