var BezierEasing = require("bezier-easing");

function myMove(element, callback) {
  let id = null;
  const elem = document.getElementById("animate");
  let pos = 0;
  clearInterval(id);
  id = setInterval(frame, 5);
  function frame() {
    if (pos == 350) {
      clearInterval(id);
    } else {
      pos++;
      elem.style.top = pos + 'px';
      elem.style.left = pos + 'px';
    }
  }
}

function CollapseSideWindow(annotate) {
  let id = null;
  const elem = document.getElementsByClassName("sideMenu")[0];
  const width = elem.offsetWidth
  console.log(width)
  let pos = 0;
  clearInterval(id);
  id = setInterval(frame, 0.6);
  function frame() {
    if (pos > 120) {
      clearInterval(id);
      annotate.setState({disappear : "sideMenuDisappear"})
    } else {
      var easing = BezierEasing(0.42, 0, 0.58, 1);
      var dis = easing(pos/120) * width
      elem.style.width = width - dis + 'px';
      pos++
      console.log(pos , width)
    }
  }
}

export {myMove, CollapseSideWindow}

//https://www.w3schools.com/js/js_htmldom_animate.asp
