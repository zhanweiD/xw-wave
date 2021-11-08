/**
 * create a parallelogram with auto degree which not exceed the area
 * @param {Number} left
 * @param {Number} top
 * @param {Number} width
 * @param {Number} height
 * @param {Number} angle
 * @returns {Array<Number} polygon points
 */
export const createParallelogram = (left, top, width, height, angle = 45) => [
  [left, top],
  [left + width, top],
  [left + width + Math.sin(angle) * height, top + height],
  [left + Math.sin(angle) * height, top + height],
]

/**
 * create a hexagon which not exceed the area
 * @param {Number} left
 * @param {Number} top
 * @param {Number} width
 * @param {Number} height
 * @returns {Array<Number} polygon points
 */
export const createHexagon = (left, top, width, height) => [
  [left + width * 0.5, top],
  [left + width, top + height * 0.25],
  [left + width, top + height * 0.75],
  [left + width * 0.5, top + height],
  [left, top + height * 0.75],
  [left, top + height * 0.25],
]

/**
 * create a regular five-pointed star which not exceed the area
 * @param {Number} left
 * @param {Number} top
 * @param {Number} width
 * @param {Number} height
 * @returns {Array<Number} polygon points
 */
export const createStar = (left, top, width, height) => [
  [left + width * 0.5 * (1 - Math.sin(Math.PI * 0.4)), top + height * 0.5 * (1 - Math.cos(Math.PI * 0.4))],
  [left + width * 0.5 * (1 + Math.sin(Math.PI * 0.4)), top + height * 0.5 * (1 - Math.cos(Math.PI * 0.4))],
  [left + width * 0.5 * (1 - Math.cos(Math.PI * 0.3)), top + height * 0.5 * (1 + Math.sin(Math.PI * 0.3))],
  [left + width * 0.5, top],
  [left + width * 0.5 * (1 + Math.cos(Math.PI * 0.3)), top + height * 0.5 * (1 + Math.sin(Math.PI * 0.3))],
]

/**
 * create an arrow which not exceed the area
 * @param {Number} left
 * @param {Number} top
 * @param {Number} width
 * @param {Number} height
 * @param {String} direction left or right
 * @returns {Array<Number} curve points
 */
export const createArrow = (left, top, width, height, direction) => {
  switch (direction) {
    case 'left':
      return [
        [left + width, top],
        [left, top + height / 2],
        [left + width, top + height],
      ]
    case 'right':
      return [
        [left, top],
        [left + width, top + height / 2],
        [left, top + height],
      ]
    default:
      return []
  }
}

/**
 * create a knuckle which not exceed the area
 * @param {Number} left
 * @param {Number} top
 * @param {Number} width
 * @param {Number} height
 * @param {String} direction
 * @returns {Array<Number} curve points
 */
export const createKnuckle = (left, top, width, height, direction) => {
  switch (direction) {
    case 'left-top':
      return [
        [left, top + height],
        [left, top],
        [left + width, top],
      ]
    case 'right-top':
      return [
        [left, top],
        [left + width, top],
        [left + width, top + height],
      ]
    case 'right-bottom':
      return [
        [left + width, top],
        [left + width, top + height],
        [left, top + height],
      ]
    case 'left-bottom':
      return [
        [left + width, top + height],
        [left, top + height],
        [left, top],
      ]
    default:
      return []
  }
}
