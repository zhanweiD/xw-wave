import chroma from 'chroma-js'
import {mean} from 'd3'

/**
 * nice color matrix
 * @param {*} maxtrix color matrix
 * @param {*} maxDistance
 * @returns niced color matrix
 */
const niceColorMatrix = (maxtrix, maxDistance = 85) => {
  return maxtrix.map(row => {
    if (row.length > 1) {
      let averageDistance = Infinity
      const colorQueue = [null, ...chroma.scale(row).mode('lch').colors(100), null]
      // color crunch
      while (averageDistance > maxDistance && colorQueue.length > row.length) {
        colorQueue.pop()
        colorQueue.shift()
        const colors = chroma.scale(colorQueue).mode('lch').colors(row.length)
        // calculate distance
        const distances = []
        colors.reduce((prev, cur) => distances.push(chroma.distance(prev, cur)))
        const newAverageDistance = mean(distances)
        if (newAverageDistance >= averageDistance) {
          break
        } else {
          averageDistance = newAverageDistance
        }
      }
      return chroma.scale(colorQueue).mode('lch').colors(row.length)
    }
    return row
  })
}

export default niceColorMatrix
