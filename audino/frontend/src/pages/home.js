import React from "react";
import {Redirect} from "react-router-dom";
import LoginForm from "../containers/forms/loginForm";
import { IconButton, Button } from "../components/button";
function signUp(e) {
  window.location.href = window.location.href + "/newUser"
}

const Home = () => {
  return (
    <div className="container h-75 text-center">
      <div className="row h-100 justify-content-center align-items-center">
        <LoginForm />
        <Button
            size="lg"
            type="primary"
            //disabled={isSigningIn ? true : false}
            onClick={(e) => window.location.href = `/newUser`}
            //isSubmitting={isSigningIn}
            text="No Account? Sign up here!"
          />
      </div>
    </div>
    
  );
};

export default Home;
