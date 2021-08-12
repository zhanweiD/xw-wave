import * as d3 from 'd3'
import LayerBase from './base'

// 默认样式
const defaultStyle = {
  path: {},
  text: {},
}

export default class BaseMapLayer extends LayerBase {
  #data = null

  #path = null

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['path', 'text'])
    this.className = 'wave-base-map'
  }

  // 传入字符串
  setData(data) {
    this.#data = data || this.#data
    const {top, left, width, height} = this.options.layout
    const projection = d3.geoMercator().fitExtent([[left, top], [width, height]], this.#data)
    this.#path = d3.geoPath(projection)
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
  }

  draw() {
    const pathData = [{
      data: this.#data.features,
      path: this.#path,
      ...this.#style.path,
    }]
    const textData = [{
      data: [this.#textData.value],
      position: [[this.#textData.x, this.#textData.y]],
      ...this.#style.text,
    }]
    this.drawBasic('path', pathData)
    this.drawBasic('text', textData)
  }
}
