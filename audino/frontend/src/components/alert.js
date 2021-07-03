import React from "react";
import PropTypes from "prop-types";

const Alert = ({ type, message, overlay, onClose = () => {} }) => {
  return (
    <div
      className={`alert alert-${type} alert-dismissible fade show ${
        overlay ? "overlay" : ""
      }`}
      style={{ cursor: "pointer", bottom: 0, left: "2%" }}
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
  );
};

Alert.propTypes = {
  type: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  overlay: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Alert;
