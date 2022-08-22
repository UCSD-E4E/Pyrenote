import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';
import setAuthorizationToken from './utils';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';

import './css/index.css';
import './css/buttons.css';

//Code to handle token authorization work so server can recongize the user
//who sends requests
setAuthorizationToken(localStorage.getItem('access_token'));

/**
 * Entire website is rendered in <App />
 * React code to handle everything really
 */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
