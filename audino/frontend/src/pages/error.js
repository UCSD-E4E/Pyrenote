import React from 'react';

/*
 * Error
 * Genertic Error Page
 * Shown to use for a critical error
 */
const Error = props => {
  const { message } = props;
  return (
    <div className="container h-75 text-center">
      <div className="row h-100 justify-content-center align-items-center">{message}</div>
    </div>
  );
};

export default Error;
