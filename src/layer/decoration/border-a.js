import {createKnuckle} from '../../utils/shape'
import LayerBase from '../base'

const MODE = {
  CUBE: 'cube',
  KNUCKLE: 'knuckle',
  BRACKET: 'bracket',
}

const defaultOptions = {
  mode: MODE.BRACKET,
}

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['shape'])
    this.className = 'wave-border-a'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout, mode} = this.options
    const {left, top, width, height} = layout
    const {shape, shapeSize} = this.style
    // change strokeWidth for cube
    if (mode === MODE.CUBE) {
      shape.strokeWidth = shapeSize * 2
    }
    const {strokeWidth} = shape
    // change verticalLength for bracket
    let verticalLength = shapeSize
    if (mode === MODE.BRACKET) {
      verticalLength = (height - strokeWidth) / 2
    }
    const innerLeft = left + strokeWidth / 2
    const innerTop = top + strokeWidth / 2
    const innerRight = left + width - strokeWidth / 2
    const innerBottom = top + height - strokeWidth / 2
    // border consists of 4 polylines
    this.#data = [
      createKnuckle(innerLeft, innerTop, shapeSize, verticalLength + 0.1, 'left-top'),
      createKnuckle(innerRight - shapeSize, innerTop, shapeSize, verticalLength + 0.1, 'right-top'),
      createKnuckle(innerRight - shapeSize, innerBottom - verticalLength, shapeSize, verticalLength, 'right-bottom'),
      createKnuckle(innerLeft, innerBottom - verticalLength, shapeSize, verticalLength, 'left-bottom'),
    ]
  }

  draw() {
    const lineData = {
      data: this.#data,
      ...this.#style.shape,
    }
    this.drawBasic('curve', [lineData], 'shape')
  }
}
