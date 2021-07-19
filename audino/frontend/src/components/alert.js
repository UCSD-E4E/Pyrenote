/* eslint "jsx-a11y/no-noninteractive-element-interactions": "off" */
import React from 'react';
import PropTypes from 'prop-types';
import BootstrapAlert from 'react-bootstrap/Alert';

const Alert = ({ type, message, overlay, onClose }) => {
  return (
    <div
      className={overlay ? "overlay" : ""}
      style={{
        top: "2%",
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className={`alert alert-${type} alert-dismissible fade show ${
          overlay ? "overlay" : ""
        }`}
        style={{ cursor: "pointer" }}
        onClick={onClose}
        role="alert"
      >
        {message}
        <button
          type="button"
          className="close"
          data-dismiss="alert"
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  overlay: PropTypes.bool,
  onClick: PropTypes.func
};

Alert.defaultProps = {
  overlay: false,
  onClick: () => {}
};

export default Alert;
