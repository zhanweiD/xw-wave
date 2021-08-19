import * as d3 from 'd3'
import LayerBase from '../base'

// 默认样式
const defaultStyle = {
  block: {},
  text: {},
}

export default class BaseMapLayer extends LayerBase {
  #data = {}

  #scale = {}

  #path = null

  #blockData = {}

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['block', 'text'])
    this.className = 'wave-base-map'
    this.tooltipTargets = ['block']
  }

  // 数据为标准的 GeoJSON
  setData(data, scales) {
    this.#data = data || this.#data
    const {top, left, width, height} = this.options.layout
    const projection = d3.geoMercator().fitExtent([[left, top], [width, height]], this.#data)
    this.#path = d3.geoPath(projection)
    this.#scale = this.createScale({scalePosition: projection}, this.#scale, scales)
    this.#blockData = this.#data.features.map(({geometry, properties}) => ({
      source: Object.entries(properties).map(([category, value]) => ({category, value})),
      geometry,
    }))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    this.#textData = this.#data.features.map(({properties, geometry}) => this.createText({
      value: properties.name,
      x: this.#path.centroid(geometry)[0],
      y: this.#path.centroid(geometry)[1],
      style: this.#style.text,
      position: 'center',
    }))
  }

  // 绘制地图
  draw() {
    const blockData = [{
      path: this.#path,
      data: this.#blockData.map(({geometry}) => geometry),
      source: this.#blockData.map(({source}) => source),
      ...this.#style.block,
    }]
    const textData = [{
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }]
    this.drawBasic('path', blockData, 'block')
    this.drawBasic('text', textData)
  }
}
