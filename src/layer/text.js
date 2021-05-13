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
  text: {},
}

// 标题图层
export default class TextLayer extends LayerBase {
  #data = null

  #style = defaultStyle

  #position = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = 'wave-text'
  }

  // 传入字符串
  setData(data) {
    this.#data = data || this.#data
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, text = {}} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12} = text
    // 水平位置
    if (align === alignType.START) {
      this.#position[0] = left
    } else if (align === alignType.MIDDLE) {
      this.#position[0] = left + (width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === alignType.END) {
      this.#position[0] = left + width - getTextWidth(this.#data, fontSize)
    }
    // 垂直位置
    if (verticalAlign === alignType.START) {
      this.#position[1] = top + fontSize
    } else if (verticalAlign === alignType.MIDDLE) {
      this.#position[1] = top + (height + fontSize) / 2
    } else if (verticalAlign === alignType.END) {
      this.#position[1] = top + height
    }
  }

  draw() {
    const textData = [{
      data: [this.#data],
      position: [this.#position],
      ...this.#style.text,
    }]
    this.drawBasic('text', textData)
  }
}
