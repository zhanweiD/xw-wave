import chroma from 'chroma-js'
import {mean} from 'd3'
import createLog from './create-log'

export default class ColorMatrix {
  #matrix

  get matrix() {
    return this.#matrix
  }

  constructor(matrix) {
    this.#matrix = matrix
    this.log = createLog('util/color-matrix')
  }

  get(row, column) {
    if (row < this.#matrix.length && column < this.#matrix[row].length) {
      return this.#matrix[row][column]
    }
    this.log.warn('Get color out of bounds', {row, column})
    return this.#matrix[row % this.#matrix.length][column % this.#matrix[row % this.#matrix.length].length]
  }

  /**
   * nice color matrix
   * @param {*} maxDistance
   * @param {*} colorSpace
   */
  nice(maxDistance = 85, colorSpace = 'lab') {
    this.#matrix = this.#matrix.map(row => {
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
          colors.reduce((prev, cur) => distances.push(chroma.distance(prev, cur, colorSpace)))
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
}
