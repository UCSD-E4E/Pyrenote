const BezierEasing = require('bezier-easing');

function myMove(callback = () => {}) {
  let id = null;
  let pos = 0;
  clearInterval(id);

  function frame() {
    if (pos === 350) {
      clearInterval(id);
    } else {
      pos++;
      callback();
    }
  }

  id = setInterval(frame, 5);
}

function CollapseSideWindow(annotate) {
  let id = null;
  const elem = document.getElementsByClassName('sideMenu')[0];
  const width = elem.offsetWidth;
  let pos = 0;
  clearInterval(id);

  function frame() {
    if (pos > 120) {
      clearInterval(id);
      annotate.setState({ disappear: 'sideMenuDisappear' });
    } else {
      const easing = BezierEasing(0.42, 0, 0.58, 1);
      const dis = easing(pos / 120) * width;
      elem.style.width = `${width - dis}px`;
      pos++;
    }
  }

  id = setInterval(frame, 0.6);
}

export { myMove, CollapseSideWindow };

// https://www.w3schools.com/js/js_htmldom_animate.asp
