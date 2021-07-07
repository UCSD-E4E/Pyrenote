/**
 * Apply a map of styles to an element
 *
 * @param {HTMLElement} el The element that the styles will be applied to
 * @param {Object} styles The map of propName: attribute, both are used as-is
 *
 * @return {HTMLElement} el
 */
export default function style(el, styles) {
  const theElement = el;
  Object.keys(styles).forEach(prop => {
    if (theElement.style[prop] !== styles[prop]) {
      theElement.style[prop] = styles[prop];
    }
  });
  return theElement;
}
