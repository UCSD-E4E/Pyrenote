import React from 'react';
import { Button } from '../../../components/button';

const PreviousAnnotationButton = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { applyPreviousAnnotations } = state;
  console.log(applyPreviousAnnotations)
  return (
    
    <div>
    {applyPreviousAnnotations !== null?
      <div className="col-4">
        <Button
          size="lg"
          type="primary"
          onClick={() => annotate.setState({applyPreviousAnnotations: !applyPreviousAnnotations})}
          text={applyPreviousAnnotations? "apply previous annotations enabled" : "apply previous annotations disabled"}
        />
      </div> : null}
    </div>
  );
};

export default PreviousAnnotationButton;
