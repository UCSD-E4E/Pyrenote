import React from 'react';

const LabelSection = props => {
  const {wavesurferMethods, selectedSegment, isPlaying, labels} = props.state;
  return (
    <div>
      {/* this renders play and skip buttons */}
      {wavesurferMethods && wavesurferMethods.renderButtons(isPlaying)}

      {selectedSegment ? (
        <div>
          <div className="row justify-content-center my-4">
            {Object.entries(labels).map(([key, value], index) => {
              if (!value.values.length) {
                return null;
              }
              return (
                <div className="col-3 text-left" key={index}>
                  <label htmlFor={key} className="font-weight-bold">
                    {key}
                  </label>
                  <select
                    className="form-control"
                    name={key}
                    multiple={value.type === 'Multi-select'}
                    value={
                      (selectedSegment &&
                        selectedSegment.data.annotations &&
                        selectedSegment.data.annotations[key] &&
                        selectedSegment.data.annotations[key].values) ||
                      (value.type === 'Multi-select' ? [] : '')
                    }
                    onChange={e => props.handleLabelChange(key, e)}
                    ref={el => {
                      props.labelRef[key] = el;
                    }}
                  >
                    {value.type !== 'Multi-select' ? (
                      <option value="-1">Choose Label Type</option>
                    ) : null}
                    {value.values.map(val => {
                      return (
                        <option key={val.value_id} value={`${val.value_id}`}>
                          {val.value}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LabelSection
