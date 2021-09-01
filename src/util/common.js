/**
 * some tinny functions that will be used by other functions
 */

import chroma from 'chroma-js'

/**
 * combining color and opacity and check for errors
 * @param {String} color 
 * @param {Number} opacity 
 */
export const mergeAlpha = (color, opacity) => {
  try {
    if (typeof color !== 'string' && typeof color !== 'number') {
      throw new Error()
    }
    return chroma(color).alpha(opacity).hex()
  } catch (error) {
    return color
  }
}

/**
 * get real attr from target (such as array or itself)
 * @param {*} target 
 * @param {Number} index 
 * @param {*} defaultValue 
 * @returns 
 */
export const getAttr = (target, index, defaultValue = null) => {
  if (Array.isArray(target)) {
    if (target.length > index && target[index]) {
      return target[index]
    }
    return defaultValue
  }
  return target !== undefined ? target : defaultValue
}
