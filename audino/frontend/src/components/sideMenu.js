import React from 'react';
import { ReferenceWindow } from './reference';

const SideMenu = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { projectId, referenceWindowOn } = state;

  return (
    <div className="sidebar">
      {referenceWindowOn ? <ReferenceWindow annotate={annotate} projectId={projectId} /> : null}
    </div>
  );
};

export default SideMenu;
