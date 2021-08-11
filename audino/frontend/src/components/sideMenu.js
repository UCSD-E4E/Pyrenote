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

const sidebarResizerHandler = () => {
  try {
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;
    const rightSide = resizer.nextElementSibling;

    // The current position of mouse
    let x = 0;

    // Width of left side
    let leftWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseMoveHandler = e => {
      const dx = e.clientX - x;

      const newLeftWidth =
        ((leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
      leftSide.style.width = `${newLeftWidth}%`;
      rightSide.style.width = `${95 - newLeftWidth}%`;

      resizer.style.cursor = 'col-resize';
      document.body.style.cursor = 'col-resize';
      leftSide.style.userSelect = 'none';
      leftSide.style.pointerEvents = 'none';

      rightSide.style.userSelect = 'none';
      rightSide.style.pointerEvents = 'none';
    };

    const mouseUpHandler = () => {
      resizer.style.removeProperty('cursor');
      document.body.style.removeProperty('cursor');

      leftSide.style.removeProperty('user-select');
      leftSide.style.removeProperty('pointer-events');

      rightSide.style.removeProperty('user-select');
      rightSide.style.removeProperty('pointer-events');

      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    const mouseDownHandler = e => {
      // Get the current mouse position
      x = e.clientX;
      leftWidth = leftSide.getBoundingClientRect().width;

      // Attach the listeners to `document`
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);
  } catch (e) {
    console.error(e);
  }
};

export { SideMenu, sidebarResizerHandler };
