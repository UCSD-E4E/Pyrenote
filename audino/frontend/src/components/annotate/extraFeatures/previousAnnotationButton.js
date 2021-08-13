import React from 'react';
import { Button } from '../../button';

const PreviousAnnotationButton = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { applyPreviousAnnotations } = state;

  return (
    <div className="sideMenuItem">
      Carry over annotations to new region
      {applyPreviousAnnotations !== null ? (
        <Button
          size="lg"
          type="primary"
          onClick={() => annotate.setState({ applyPreviousAnnotations: !applyPreviousAnnotations })}
          text={
            applyPreviousAnnotations
              ? 'apply previous annotations enabled'
              : 'apply previous annotations disabled'
          }
        />
      ) : null}
      <br />
    </div>
  );
};

export default PreviousAnnotationButton;
