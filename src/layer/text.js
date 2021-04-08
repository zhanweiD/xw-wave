import LayerBase from './base'
import getTextWidth from '../util/text-wdith'

// 默认样式
const defaultStyle = {
  align: 'start',
  verticalAlign: 'start',
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
    this.#style = {...this.#style, ...style}
    const {align, verticalAlign, text = {}} = this.#style
    const {width, height} = this.options.layout
    const {fontSize = 12} = text
    // 水平位置
    if (align === 'start') {
      this.#position[0] = 0
    } else if (align === 'center') {
      this.#position[0] = (width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === 'end') {
      this.#position[0] = width - getTextWidth(this.#data, fontSize)
    }
    // 垂直位置
    if (verticalAlign === 'start') {
      this.#position[1] = fontSize
    } else if (verticalAlign === 'center') {
      this.#position[1] = (height + fontSize) / 2
    } else if (verticalAlign === 'end') {
      this.#position[1] = height
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
