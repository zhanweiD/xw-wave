import * as d3 from 'd3'
import getTextWidth from './text-width'

/**
 * format number
 * @param {String|Number} text 
 * @param {Object} config 
 * @returns {String} formatted string
 */
export const formatNumber = (text, config) => {
  // anonymous formatting
  if (!config) {
    if (text && !Number.isNaN(Number(text))) {
      return d3.format(`.${8}~f`)(text)
    }
    return text
  }
  // custom formatting
  const {
    percentage = false, // 0.1234 or 12.34%
    thousandth = false, // 1234 or 1,234
    decimalPlace = 8,
  } = config
  return d3.format(`${thousandth ? ',' : ''}.${decimalPlace}~${percentage ? '%' : 'f'}`)(text)
}

/**
 * text overflow control
 * @param {String|Number} text 
 * @param {Object} config 
 * @returns {String} formatted string
 */
export const overflowControl = (text, config) => {
  const {
    omit = true, // add '...' or not
    width = Infinity, // max display width
    height = Infinity, // max display height
    fontSize = 12,
  } = config
  // width overflow: crop
  if (fontSize <= height && width < getTextWidth(text, fontSize)) {
    for (let i = text.length; i > 0; i--) {
      const subString = `${text.substring(0, i)}${omit ? '...' : ''}`
      if (width > getTextWidth(subString, fontSize)) {
        return subString
      }
    }
  }
  // height overflow: hide
  if (fontSize > height) {
    return null
  }
  return text
}
