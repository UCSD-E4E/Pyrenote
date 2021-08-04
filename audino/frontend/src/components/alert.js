/* eslint "jsx-a11y/no-noninteractive-element-interactions": "off" */
import React from 'react';
import PropTypes from 'prop-types';
import BootstrapAlert from 'react-bootstrap/Alert';

const Alert = ({ type, message, overlay, onClose }) => {
  return (
    <div className={overlay ? 'overlay center-top' : ''}>
      <BootstrapAlert
        variant={type}
        style={{ cursor: 'pointer' }}
        onClick={onClose}
        role="alert"
        dismissible={onClose != null}
      >
        {message}
      </BootstrapAlert>
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


const AlertSection = ({ messages, callback, overlay }) => {
  let oneAlertRendered = false;
  console.log(messages)
  const renderAlerts = (type, message, overlay=true, callback=((e) => {})) => {
    return (
      <div>
        <Alert type={type} message={message} overlay={overlay} onClose={e => callback(e)} />
      </div>
    );
  }

  return (
    <div>
      {messages.map((data) => {
       const type = data["type"]
       const message = data["message"]
       if (oneAlertRendered && overlay) {
          return(null)
       }
       else if (message && message !== '') {
         oneAlertRendered = true;
         return (message && renderAlerts(type, message, overlay, callback)) 
       }
      })}
    </div>
  )
}

AlertSection.defaultProps = {
  messages: [],
  overlay: false,
  callback: () => {}
};

export default Alert
export {Alert, AlertSection};
