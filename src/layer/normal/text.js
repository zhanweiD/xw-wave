import LayerBase from '../base'
import getTextWidth from '../../utils/text-width'

const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

const defaultStyle = {
  align: alignType.START,
  verticalAlign: alignType.START,
  offset: [0, 0],
  text: {},
}

export default class TextLayer extends LayerBase {
  #data = null

  #textData = null

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text'])
    this.className = 'wave-text'
  }

  // data is string
  setData(data) {
    this.#data = data || this.#data
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, offset, text} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12} = text
    let [x, y] = [0, 0]
    // horizontal position
    if (align === alignType.START) {
      x = left
    } else if (align === alignType.MIDDLE) {
      x = left + (width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === alignType.END) {
      x = left + width - getTextWidth(this.#data, fontSize)
    }
    // vertical position
    if (verticalAlign === alignType.START) {
      y = top + fontSize
    } else if (verticalAlign === alignType.MIDDLE) {
      y = top + (height + fontSize) / 2
    } else if (verticalAlign === alignType.END) {
      y = top + height
    }
    this.#textData = this.createText({x, y, value: this.#data, style: text, offset})
  }

  draw() {
    const textData = [
      {
        data: [this.#textData.value],
        position: [[this.#textData.x, this.#textData.y]],
        ...this.#style.text,
      },
    ]
    this.drawBasic('text', textData)
  }
}
