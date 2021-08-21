import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGripVertical,
  faAngleDoubleLeft,
  faAngleDoubleRight
} from '@fortawesome/free-solid-svg-icons';
import { IconButton } from './button';

const sidebarResizerHandler = (left, right) => {
  try {
    const resizer = document.getElementById('dragMe');
    const leftSide = document.getElementById(left); // resizer.previousElementSibling;
    const rightSide = document.getElementById(right);

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

const Resizer = props => {
  const { isOpen, annotate, rightID, leftID } = props;
  sidebarResizerHandler(rightID, leftID);
  return (
    <div className="resizer" id="dragMe" style={{ width: '5px' }}>
      <IconButton
        icon={isOpen ? faAngleDoubleLeft : faAngleDoubleRight}
        type="primary"
        onClick={() => annotate.collapseSideBar()}
        title={isOpen ? 'collapse side menu' : 'open side menu'}
      />
      {isOpen ? (
        <div id="sidebarDragger">
          <FontAwesomeIcon size="2x" icon={faGripVertical} />
        </div>
      ) : null}
    </div>
  );
};

export default Resizer;
