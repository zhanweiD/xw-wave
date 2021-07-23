import LayerBase from './base'
import getTextWidth from '../util/text-width'

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 默认样式
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

  // 传入字符串
  setData(data) {
    this.#data = data || this.#data
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, offset, text} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12} = text
    let [x, y] = [0, 0]
    // 水平位置
    if (align === alignType.START) {
      x = left
    } else if (align === alignType.MIDDLE) {
      x = left + (width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === alignType.END) {
      x = left + width - getTextWidth(this.#data, fontSize)
    }
    // 垂直位置
    if (verticalAlign === alignType.START) {
      y = top + fontSize
    } else if (verticalAlign === alignType.MIDDLE) {
      y = top + (height + fontSize) / 2
    } else if (verticalAlign === alignType.END) {
      y = top + height
    }
    // 文字数据
    this.#textData = this.createText({x, y, value: this.#data, style: text, offset})
  }

  draw() {
    const textData = [{
      data: [this.#textData.value],
      position: [[this.#textData.x, this.#textData.y]],
      ...this.#style.text,
    }]
    this.drawBasic('text', textData)
  }
}
