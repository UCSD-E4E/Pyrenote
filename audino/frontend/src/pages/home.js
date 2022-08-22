import React from 'react';
import LoginForm from '../containers/forms/loginForm';
import { Button } from '../components/button';

/*
 * Home
 * Frist page the user enters into
 * Contains the login react form and button to sign up
 * as a new user.
 */
const Home = () => {
  return (
    <div className="container h-75 text-center">
      <div className="row h-100 justify-content-center align-items-center">
        <LoginForm />
        <Button
          size="lg"
          type="primary"
          onClick={() => {
            window.location.href = `/newUser`;
          }}
          text="No account? Sign up here!"
        />
      </div>
    </div>
  );
};

export default Home;
