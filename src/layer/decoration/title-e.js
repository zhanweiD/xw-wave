import chroma from 'chroma-js'
import LayerBase from '../base'
import {createParallelogram} from '../../utils/shape'
import {range} from '../../utils/common'

const defaultStyle = {
  mainColor: 'rgb(255,165,0)',
  minorColor: 'rgb(200,200,200)',
  polygon: {
    strokeWidth: 6,
  },
  line: {
    strokeWidth: 1,
  },
  rect: {},
}

export default class TitleDLayer extends LayerBase {
  #polygonData = []

  #rectData = []

  #lineData = []

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['polygon', 'rect', 'line'])
    this.className = 'wave-title-e'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, height, width} = layout
    const {mainColor, minorColor, polygon, line} = this.#style
    const {strokeWidth} = polygon
    // parallelograms
    this.#polygonData = [{
      points: createParallelogram(left + strokeWidth, top + strokeWidth * 2, height, height - strokeWidth * 3),
      stroke: chroma(minorColor).alpha(0.2),
    }, {
      points: createParallelogram(left + strokeWidth * 2, top + strokeWidth * 0.5, height, height - strokeWidth * 3),
      stroke: createGradient({
        type: 'linear',
        direction: 'horizontal',
        colors: [chroma(minorColor).alpha(0.2), chroma(minorColor)],
        y2: 1,
      }),
    }]
    // rect
    const rectFill = createGradient({
      type: 'linear',
      direction: 'horizontal',
      colors: [mainColor, minorColor],
    })
    this.#rectData = [{
      x: left + height * 0.6,
      y: left + height * 0.15,
      width: height * 0.9,
      height: strokeWidth / 2,
      fill: rectFill,
    }, {
      x: left + height * 0.75,
      y: left + height * 0.35,
      width: height * 0.75,
      height: strokeWidth / 2,
      fill: rectFill,
    }, {
      x: left + height * 0.9,
      y: left + height * 0.55,
      width: height * 0.6,
      height: strokeWidth / 2,
      fill: rectFill,
    }]
    // lines
    const x1 = left + height * 1.5 + strokeWidth * 2
    const y1 = top + height - strokeWidth * 2 - line.strokeWidth
    const y2 = top + height * 0.5
    const lineStroke = createGradient({
      type: 'linear',
      direction: 'horizontal',
      colors: [chroma(minorColor).alpha(0.5), chroma(minorColor).alpha(0)],
    })
    this.#lineData = [{x1, y1, y2: y1, x2: x1 + width, stroke: minorColor}]
    range(0.1, 10, 0.5).forEach(degree => this.#lineData.push({
      x1, y1, y2, x2: (y1 - y2) / Math.tan((degree / 180) * Math.PI) + x1, stroke: lineStroke,
    }))
  }

  draw() {
    const polygonData = [{
      data: this.#polygonData.map(item => item.points),
      stroke: this.#polygonData.map(item => item.stroke),
      fill: null,
      ...this.#style.polygon,
    }]
    const rectData = [{
      data: this.#rectData.map(({width, height}) => [width, height]),
      position: this.#rectData.map(({x, y}) => [x, y]),
      fill: this.#rectData.map(({fill}) => fill),
      ...this.#style.rect,
    }]
    const lineData = [{
      data: this.#lineData.map(({x1, x2, y1, y2}) => [x1, y1, x2, y2]),
      stroke: this.#lineData.map(({stroke}) => stroke),
      ...this.#style.line,
    }]
    this.drawBasic('polygon', polygonData)
    this.drawBasic('rect', rectData)
    this.drawBasic('line', lineData)
  }
}
