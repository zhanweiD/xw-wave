import {createKnuckle} from '../../util/shape'
import LayerBase from '../base'

const defaultStyle = {
  shapeSize: 10,
  shape: {
    stroke: '#fff',
    strokeWidth: 4,
  },
}

export default class BorderALayer extends LayerBase {
  #data = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['shape'])
    this.className = 'wave-border-a'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout} = this.options
    const {left, top, width, height} = layout
    const {shape, shapeSize} = this.style
    const {strokeWidth} = shape
    const innerLeft = left + shapeSize + strokeWidth / 2
    const innerTop = top + shapeSize + strokeWidth / 2
    const innerRight = left + width - shapeSize - strokeWidth / 2
    const innerBottom = top + height - shapeSize - strokeWidth / 2
    this.#data = [
      createKnuckle(innerLeft - shapeSize, innerTop - shapeSize, shapeSize, shapeSize, 'left-top'),
      createKnuckle(innerRight, innerTop - shapeSize, shapeSize, shapeSize, 'right-top'),
      createKnuckle(innerRight, innerBottom, shapeSize, shapeSize, 'right-bottom'),
      createKnuckle(innerLeft - shapeSize, innerBottom, shapeSize, shapeSize, 'left-bottom'),
    ]
  }

  draw() {
    const lineData = [{
      data: this.#data,
      ...this.#style.shape,
    }]
    this.drawBasic('curve', lineData, 'shape')
  }
}
