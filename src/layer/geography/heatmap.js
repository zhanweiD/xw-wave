import * as h337 from 'heatmap.js'
import LayerBase from '../base'

const defaultStyle = {
  radius: 10,
  maxOpacity: 1,
  minOpacity: 0,
  blur: 0.75,
  gradient: {
    0.3: 'green',
    0.6: 'yellow',
    0.9: 'red',
  },
}

export default class HeatmapLayer extends LayerBase {
  #data = {}

  #scale = {}

  #pointData = {}

  #instance = null

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
    super(layerOptions, waveOptions)
    const {container} = this.options
    this.className = 'wave-heatmap'
    this.#instance = h337.create({container: container.node()})
    this.event.on('destroy', () => container.selectAll('.heatmap-canvas').remove())
  }

  setData(data, scales) {
    this.#data = data || this.#data
    // initialize scale
    this.#scale = this.createScale({}, this.#scale, scales)
    const {scaleX, scaleY} = this.#scale
    if (scaleX && scaleY) {
      const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
      this.#pointData = pureTableList.map(([x, y, value]) => ({
        value,
        // why
        x: Number(scaleX(x)).toFixed(0), 
        y: scaleY(y), 
      }))
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    this.#instance.configure(this.#style)
  }

  draw() {
    this.#instance.setData({data: this.#pointData})
  }
}
