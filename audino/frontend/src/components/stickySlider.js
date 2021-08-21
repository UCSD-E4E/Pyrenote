import React from 'react';
import PropTypes from 'prop-types';

const noop = () => {};

const StickySlider = ({
  min = 0,
  max = 10,
  hasLabels = true,
  threshold = 10,
  stickyPos = [],
  changeCallback = noop
}) => {
  const [value, setValue] = React.useState(Math.floor((max - min) / 2));

  const handleChange = e => {
    const newValue = e.target.value;
    changeCallback(newValue);
    setValue(newValue);
  };

  const handleStick = e => {
    let finalValue = e.target.value;
    stickyPos.forEach(pos => {
      if (Math.abs(pos - finalValue) < threshold) finalValue = pos;
    });
    changeCallback(finalValue);
    setValue(finalValue);
  };

  const computePos = index => {
    const val = stickyPos[index];
    const newVal = Number(((val - min) * 100) / (max - min));
    return `calc(${newVal}% + (${7 - newVal * 0.16}px))`;
  };

  const computeSpacing = index => {
    const val = String(stickyPos[index]);
    const length = val.length;
    return `${length * -4}px`;
  };

  const renderLabels = () => {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '24px',
          left: '0px',
          textAlign: 'center'
        }}
      >
        {stickyPos.map((label, index) => {
          return (
            <div
              style={{
                float: 'left',
                position: 'absolute',
                overflow: 'visible',
                zIndex: 1,
                left: computePos(index),
                textAlign: 'left',
                justifyContent: 'left'
              }}
            >
              <div className="vl" />
              <text style={{ position: 'relative', left: computeSpacing(index), top: '-5px' }}>
                {label}
              </text>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="sideMenuItem" style={{ overflow: 'visible' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ position: 'absolute', width: '100%', height: '24px', top: '-4px' }}>
          <div style={{ padding: '0px', zIndex: 90, overflow: 'visible' }} className="sideMenuItem">
            {hasLabels && renderLabels()}
          </div>
        </div>
      </div>
      <input
        className="sideMenuItem"
        id="StickySlide"
        style={{ padding: '0px', zIndex: 100, position: 'relative', overflow: 'visible' }}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => handleChange(e)}
        onMouseUp={e => handleStick(e)}
      />
    </div>
  );
};

StickySlider.propTypes = {
  item: PropTypes.objectOf.isRequired,
  isChecked: PropTypes.bool
};

StickySlider.defaultProps = {
  isChecked: false
};

export default StickySlider;
