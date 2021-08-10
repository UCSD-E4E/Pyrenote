import React from 'react';
import { ReferenceWindow } from '../components/reference';

const SideMenu = props => {
  const {annotate} = props;
  const {state} = annotate
  const {projectId, referenceWindowOn} = state

  const resize = (e) => {
    const drag = document.getElementsById("sidebarDragger")
    if (drag == null) return


  }

  return (
    <div className="sidebar">
      {referenceWindowOn ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}
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
    let rightWidth = 0;
    let leftWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function(e) {
        // Get the current mouse position
        x = e.clientX;
        rightWidth = rightSide.getBoundingClientRect().width;
        leftWidth = leftSide.getBoundingClientRect().width;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);
    

    const mouseMoveHandler = function(e) {
      
      const dx = e.clientX - x;

      const newLeftWidth = (leftWidth + dx) * 100 / resizer.parentNode.getBoundingClientRect().width;
      leftSide.style.width = `${newLeftWidth}%`;
      rightSide.style.width = `${95 - newLeftWidth}%`;

      resizer.style.cursor = 'col-resize';
      document.body.style.cursor = 'col-resize';
      leftSide.style.userSelect = 'none';
      leftSide.style.pointerEvents = 'none';
  
      rightSide.style.userSelect = 'none';
      rightSide.style.pointerEvents = 'none';
  };

  const mouseUpHandler = function() {
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
  } catch {

  }
}

export {SideMenu, sidebarResizerHandler};
