import axios from 'axios';

/*
 * Set token in browser for user's information for redis
 */
const setAuthorizationToken = token => {
  if (token) {
    axios.defaults.headers.common.Authorization = token;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export default setAuthorizationToken;
