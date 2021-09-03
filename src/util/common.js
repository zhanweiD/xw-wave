/**
 * some tinny functions that will be used by other functions
 */

import chroma from 'chroma-js'

import * as d3 from 'd3'

/**
 * userful for get sequence array
 * the output range does include 'stop'
 * @param {*} start 
 * @param {*} end 
 * @param {*} step 
 * @param {*} toFixed dicimal number
 */
export const range = (start, end, step, toFixed = 8) => {
  return d3.range(start, end + (step > 0 ? 1 : -1) * 10 ** -(toFixed + 2), step)
    .map(v => Number(Number(v).toFixed(toFixed)))
}

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
