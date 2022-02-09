import React from 'react';

const LabelSection = props => {
  const { state } = props;
  const { wavesurferMethods, selectedSegment, isPlaying, labels } = state;

  const handleLabelChange = (key, e) => {
    const { annotate } = props;
    const { selectedSegment, labels, wavesurferMethods } = annotate.state;
    selectedSegment.data.annotations = selectedSegment.data.annotations || {};
    if (e.target.value === '-1') {
      return;
    }
    if (labels[key].type === 'Multi-select') {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
        values: Array.from(e.target.selectedOptions, option => option.value)
      };
    } else {
      selectedSegment.data.annotations[key] = {
        label_id: labels[key].label_id,
        values: e.target.value
      };
    }
    wavesurferMethods.styleRegionColor(selectedSegment, 'rgba(0, 102, 255, 0.3)');
    selectedSegment._onUnSave();
    annotate.setState({ selectedSegment, storedAnnotations: selectedSegment.data.annotations });
    console.log(key);
    console.log(e.target.value);
  };

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
                    onChange={e => handleLabelChange(key, e)}
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
  );
};

export default LabelSection;
