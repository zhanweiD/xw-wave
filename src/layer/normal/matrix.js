import * as d3 from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'
import {SHAPE} from '../../utils/constants'

const defaultOptions = {
  shape: SHAPE.RECT,
}

const defaultStyle = {
  circleSize: ['auto', 'auto'],
  circle: {},
  rect: {},
  text: {},
}

export default class MatrixLayer extends LayerBase {
  #data = null

  #scale = {}

  #style = defaultStyle

  #rectData = []

  #circleData = []

  #textData = []

  get data() {
    return this.#data
  }

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super({...defaultOptions, ...layerOptions}, chartOptions, ['rect', 'circle', 'text'])
    const {shape} = this.options
    this.className = `chart-${shape}-matrix`
    this.tooltipTargets = ['rect', 'circle']
  }

  // tableList has two dimensions
  setData(table, scales) {
    this.#data = this.createData('table', this.#data, table)
    const {shape, layout} = this.options
    const {left, top, width, height} = layout
    const [rows, columns, pureTable] = [this.#data.data[0], this.#data.data[1], this.#data.data[2]]
    // initialize scales
    this.#scale = this.createScale(
      {
        scaleX: new Scale({
          type: 'band',
          domain: columns,
          range: [0, width],
        }),
        scaleY: new Scale({
          type: 'band',
          domain: rows,
          range: [0, height],
        }),
      },
      this.#scale,
      scales
    )
    // calculate basic data
    const {scaleX, scaleY} = this.#scale
    const [bandwidthX, bandwidthY] = [scaleX.bandwidth(), scaleY.bandwidth()]
    // origin rect data
    if (shape === SHAPE.RECT) {
      this.#rectData = pureTable.map((values, i) => {
        return values.map((value, j) => ({
          value,
          source: {dimension: `${rows[i]} ${columns[j]}`, value},
          x: left + scaleX(columns[j]),
          y: top + scaleY(rows[i]),
          width: bandwidthX,
          height: bandwidthY,
        }))
      })
    }
    // origin circle data
    if (shape === SHAPE.CIRCLE) {
      this.#circleData = pureTable.map((values, i) => {
        return values.map((value, j) => ({
          value,
          source: {dimension: `${rows[i]} ${columns[j]}`, value},
          cx: left + scaleX(columns[j]) + bandwidthX / 2,
          cy: top + scaleY(rows[i]) + bandwidthY / 2,
          r: Math.min(bandwidthX, bandwidthY) / 2,
        }))
      })
    }
    // label data
    this.#data.set(
      'textData',
      pureTable.map((values, i) => {
        return values.map((value, j) => ({
          x: left + scaleX(columns[j]) + bandwidthX / 2,
          y: top + scaleY(rows[i]) + bandwidthY / 2,
          value,
        }))
      })
    )
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {shape} = this.options
    const [minValue, maxValue] = this.#data.range()
    const {circleSize, rect, circle, text} = this.#style
    // color is related with value
    const colorNumber = Number(Number(maxValue - minValue + 1).toFixed(0))
    const scaleRectColor = new Scale({
      type: 'ordinal',
      domain: d3.range(0, maxValue - minValue, 1),
      range: this.getColorMatrix(1, colorNumber, rect.fill, false).matrix[0],
    })
    const scaleCircleColor = new Scale({
      type: 'ordinal',
      domain: d3.range(0, maxValue - minValue, 1),
      range: this.getColorMatrix(1, colorNumber, circle.fill, false).matrix[0],
    })
    this.#rectData.forEach(group => {
      group.forEach(item => (item.color = scaleRectColor(Math.round(item.value - minValue))))
    })
    this.#circleData.forEach(group => {
      group.forEach(item => (item.color = scaleCircleColor(Math.round(item.value - minValue))))
    })
    // label data
    this.#textData = this.#data.get('textData').map(group => {
      return group.map(item => this.createText({...item, style: text, position: 'center'}))
    })
    // circle size is related with value
    if (shape === SHAPE.CIRCLE) {
      let [min, max] = circleSize
      const [bandwidthX, bandwidthY] = [this.#scale.scaleX.bandwidth(), this.#scale.scaleY.bandwidth()]
      const ceiling = Math.min(bandwidthX, bandwidthY) / 1.8
      if (max === 'auto' || max < 0) max = ceiling
      if (min === 'auto' || min < 0) min = max > ceiling ? ceiling / 2 : max / 2
      const scale = new Scale({
        type: 'linear',
        domain: this.#data.range(),
        range: [min, max],
      })
      this.#circleData.forEach(group => group.forEach(item => (item.r = scale(item.value))))
    }
  }

  draw() {
    const {shape} = this.options
    const rectData = this.#rectData.map(group => ({
      data: group.map(({width, height}) => [width, height]),
      source: group.map(({source}) => source),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.rect,
      fill: group.map(({color}) => color),
    }))
    const circleData = this.#circleData.map(group => ({
      data: group.map(({r}) => [r, r]),
      position: group.map(({cx, cy}) => [cx, cy]),
      source: group.map(({source}) => source),
      ...this.#style.circle,
      fill: group.map(({color}) => color),
    }))
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    shape === SHAPE.RECT && this.drawBasic('rect', rectData)
    shape === SHAPE.CIRCLE && this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}
