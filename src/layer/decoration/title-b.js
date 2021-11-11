import chroma from 'chroma-js'
import LayerBase from '../base'
import {createHexagon} from '../../utils/shape'

const defaultStyle = {
  active: true,
  mainColor: 'rgb(0,119,255)',
  minorColor: 'rgb(200,200,200)',
  polygon: {
    strokeWidth: 5,
  },
  line: {
    strokeWidth: 2,
  },
  rect: {},
}

export default class TitleBLayer extends LayerBase {
  #rectData = {}

  #lineData = []

  #polygonData = []

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['polygon', 'line', 'rect'])
    this.className = 'chart-title-b'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height} = layout
    const {active, polygon, mainColor, minorColor} = this.#style
    const {strokeWidth} = polygon
    // polygon outter area
    const [poLeft, poRight, poTop, poBottom] = [
      left + strokeWidth,
      left + (height / 2) * Math.sqrt(3) - strokeWidth,
      top + strokeWidth,
      top + height - strokeWidth,
    ]
    const [poWidth, poHeight] = [poRight - poLeft, poBottom - poTop]
    // polygon inner area
    const [piLeft, piRight, piTop, piBottom] = [
      poLeft + strokeWidth * 0.75,
      poRight - strokeWidth * 0.75,
      poTop + strokeWidth * 0.75,
      poBottom - strokeWidth * 0.75,
    ]
    const [piWidth, piHeight] = [piRight - piLeft, piBottom - piTop]
    // polygons with order
    this.#polygonData = [
      {
        points: createHexagon(poLeft, poTop, poWidth, poHeight),
        stroke: chroma(mainColor),
        strokeWidth,
        fill: '#000',
      },
      {
        points: createHexagon(piLeft, piTop, piWidth, piHeight),
        fill: active ? chroma(mainColor).darken(2) : '#000',
        stroke: chroma(mainColor).alpha(0),
        strokeWidth: 0,
      },
    ]
    // decoration lines
    if (active) {
      this.#lineData = [
        {
          stroke: chroma(mainColor).brighten(),
          x1: poLeft,
          y1: poTop,
          x2: poLeft + 5,
          y2: poTop + 5,
        },
        {
          stroke: chroma(mainColor).brighten(),
          x1: poLeft,
          y1: poBottom,
          x2: poLeft + 5,
          y2: poBottom - 5,
        },
        {
          stroke: chroma(mainColor).brighten(),
          x1: poRight,
          y1: poTop,
          x2: poRight - 5,
          y2: poTop + 5,
        },
        {
          stroke: chroma(mainColor).brighten(),
          x1: poRight,
          y1: poBottom,
          x2: poRight - 5,
          y2: poBottom - 5,
        },
      ]
    }
    // rect area
    this.#rectData = {
      x: poLeft + poWidth / 2,
      y: poTop + strokeWidth,
      width,
      height: poHeight - strokeWidth * 2,
      fill: createGradient({
        type: 'linear',
        direction: 'horizontal',
        colors: [chroma(active ? mainColor : minorColor).alpha(0.5), chroma(active ? mainColor : minorColor).alpha(0)],
      }),
    }
  }

  draw() {
    const polygonData = {
      data: this.#polygonData.map(({points}) => points),
      strokeWidth: this.#polygonData.map(({strokeWidth}) => strokeWidth),
      fill: this.#polygonData.map(({fill}) => fill),
      ...this.#style.polygon,
      stroke: this.#polygonData.map(({stroke}) => stroke),
    }
    const lineData = {
      data: this.#lineData.map(({x1, x2, y1, y2}) => [x1, y1, x2, y2]),
      stroke: this.#lineData.map(({stroke}) => stroke),
      ...this.#style.line,
    }
    const rectData = {
      data: [[this.#rectData.width, this.#rectData.height]],
      position: [[this.#rectData.x, this.#rectData.y]],
      fill: this.#rectData.fill,
      ...this.#style.rect,
    }
    this.drawBasic('rect', [rectData])
    this.drawBasic('line', [lineData])
    this.drawBasic('polygon', [polygonData])
  }
}
