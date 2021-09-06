/* eslint-disable camelcase */
import chroma from 'chroma-js'
import LayerBase from '../base'
import {createHexagon} from '../../util/shape'

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

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['polygon', 'line', 'rect'])
    this.className = 'wave-title-b'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height} = layout
    const {active, polygon, mainColor, minorColor} = this.#style
    const {strokeWidth} = polygon
    // polygon outter area
    const [po_left, po_right, po_top, po_bottom] = [
      left + strokeWidth, 
      left + (height / 2) * Math.sqrt(3) - strokeWidth, 
      top + strokeWidth,
      top + height - strokeWidth,
    ]
    const [po_width, po_height] = [
      po_right - po_left, 
      po_bottom - po_top,
    ]
    // polygon inner area
    const [pi_left, pi_right, pi_top, pi_bottom] = [
      po_left + strokeWidth * 0.75, 
      po_right - strokeWidth * 0.75, 
      po_top + strokeWidth * 0.75, 
      po_bottom - strokeWidth * 0.75,
    ]
    const [pi_width, pi_height] = [
      pi_right - pi_left, 
      pi_bottom - pi_top,
    ]
    // polygons with order
    this.#polygonData = [{
      points: createHexagon(po_left, po_top, po_width, po_height),
      stroke: chroma(mainColor),
      strokeWidth,
      fill: '#000',
    }, {
      points: createHexagon(pi_left, pi_top, pi_width, pi_height),
      fill: active ? chroma(mainColor).darken(2) : '#000',
      stroke: chroma(mainColor).alpha(0),
      strokeWidth: 0,
    }]
    // decoration lines
    this.#lineData = active ? [{
      stroke: chroma(mainColor).brighten(),
      x1: po_left,
      y1: po_top,
      x2: po_left + 5,
      y2: po_top + 5,
    }, {
      stroke: chroma(mainColor).brighten(),
      x1: po_left,
      y1: po_bottom,
      x2: po_left + 5,
      y2: po_bottom - 5,
    }, {
      stroke: chroma(mainColor).brighten(),
      x1: po_right,
      y1: po_top,
      x2: po_right - 5,
      y2: po_top + 5,
    }, {
      stroke: chroma(mainColor).brighten(),
      x1: po_right,
      y1: po_bottom,
      x2: po_right - 5,
      y2: po_bottom - 5,
    }] : []
    // rect area
    this.#rectData = {
      x: po_left + po_width / 2,
      y: po_top + strokeWidth,
      width,
      height: po_height - strokeWidth * 2,
      fill: createGradient({
        type: 'linear',
        direction: 'horizontal',
        colors: [
          chroma(active ? mainColor : minorColor).alpha(0.5),
          chroma(active ? mainColor : minorColor).alpha(0),
        ],
      }),
    }
  }

  draw() {
    const polygonData = [{
      data: this.#polygonData.map(({points}) => points),
      strokeWidth: this.#polygonData.map(({strokeWidth}) => strokeWidth),
      fill: this.#polygonData.map(({fill}) => fill),
      ...this.#style.polygon,
      stroke: this.#polygonData.map(({stroke}) => stroke),
    }]
    const lineData = [{
      data: this.#lineData.map(({x1, x2, y1, y2}) => [x1, y1, x2, y2]),
      stroke: this.#lineData.map(({stroke}) => stroke),
      ...this.#style.line,
    }]
    const rectData = [{
      data: [[this.#rectData.width, this.#rectData.height]],
      position: [[this.#rectData.x, this.#rectData.y]],
      fill: this.#rectData.fill,
      ...this.#style.rect,
    }]
    this.drawBasic('rect', rectData)
    this.drawBasic('line', lineData)
    this.drawBasic('polygon', polygonData)
  }
}
