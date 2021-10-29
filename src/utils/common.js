import chroma from 'chroma-js'
import * as d3 from 'd3'

/**
 * the output range contains stop
 * @param {*} start
 * @param {*} end
 * @param {*} step
 * @param {*} toFixed dicimal number
 */
export const range = (start, end, step = 1, toFixed = 8) => {
  return d3
    .range(start, end + (step > 0 ? 1 : -1) * 10 ** -(toFixed + 2), step)
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
    if (target.length > index && target[index] !== null && target[index] !== undefined) {
      return target[index]
    }
    return defaultValue
  }
  return target !== undefined ? target : defaultValue
}

/**
 * add style for d3 selection
 * @param {Selection} target
 * @param {Object} style
 * @param {Number} index
 */
export const addStyle = (target, style, index) => {
  Object.entries(style).forEach(([key, value]) => target.style(key, getAttr(value, index)))
}

/**
 * add event for d3 selection
 * @param {Selection} target
 * @param {Object} event
 * @param {Number} index
 */
export const addEvent = (target, event, data) => {
  Object.entries(event).forEach(([key, handler]) => target.on(key, handler.bind(null, data)))
  target.style('cursor', 'pointer')
}

/**
 * fontSize => font-size
 * @param {Object} object styles
 */
export const transformAttr = object => {
  const result = {}
  Object.entries(object).forEach(([key, value]) => {
    const index = key.search(/[A-Z]/)
    if (index !== -1) {
      key = key.toLowerCase()
      key = `${key.slice(0, index)}-${key.slice(index)}`
    }
    result[key] = value
  })
  return result
}
