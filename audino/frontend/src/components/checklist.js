import React from 'react';
import PropTypes from 'prop-types';

const noop = () => {};

const FeatureChecklist = ({ item = '', isChecked = false, handleCheck = noop }) => {
  return (
    <div>
      <input
        type="checkbox"
        onChange={handleCheck}
        style={{ flex: '1 0 25%' }}
        id={item}
        name={item}
        value={item}
        checked={isChecked}
      />
      <label htmlFor={item}>&ensp; {item}</label>
      <br />
    </div>
  );
};

FeatureChecklist.propTypes = {
  item: PropTypes.objectOf.isRequired,
  isChecked: PropTypes.bool
};

FeatureChecklist.defaultProps = {
  isChecked: false
};

export default FeatureChecklist;
