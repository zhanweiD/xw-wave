import drawText from '../basic/text'
import LayerBase from './base'
import uuid from '../util/uuid'
import getTextWidth from '../util/text-wdith'
import needRedraw from '../util/need-redraw'

const defaultStyle = {
  align: 'start',
  verticalAlign: 'start',
  text: {},
}

// 标题图层
export default class TextLayer extends LayerBase {
  #container = null

  #data = null

  #style = null

  #position = null
  
  #backup = null

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = `wave-text-${uuid()}`
    this.#container = this.options.root.append('g').attr('class', this.className)
    this.#position = [0, 0]
    this.setStyle(defaultStyle)
  }

  // 传入字符串
  setData(data) {
    this.#data = data || this.#data
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {align, verticalAlign, text = {}} = this.#style
    const {fontSize = 12} = text
    // 水平位置
    if (align === 'start') {
      this.#position[0] = 0
    } else if (align === 'center') {
      this.#position[0] = (this._layout.width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === 'end') {
      this.#position[0] = this._layout.width - getTextWidth(this.#data, fontSize)
    }
    // 垂直位置
    if (verticalAlign === 'start') {
      this.#position[1] = fontSize
    } else if (verticalAlign === 'center') {
      this.#position[1] = (this._layout.height + fontSize) / 2
    } else if (verticalAlign === 'end') {
      this.#position[1] = this._layout.height
    }
  }

  // 绘制
  draw() {
    const backup = {
      data: [this.#data],
      position: [this.#position],
      container: this.#container,
      className: `${this._className}-text`,
      ...this.#style.text,
    }
    // 判断是否进行重新绘制
    if (needRedraw(this.#backup, backup)) {
      this.#backup = backup
      drawText(backup)
    }
  }
}
