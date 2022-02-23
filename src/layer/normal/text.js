import LayerBase from '../base'
import getTextWidth from '../../utils/text-width'
import {ALIGNMENT} from '../../utils/constants'

const defaultStyle = {
  align: ALIGNMENT.START,
  verticalAlign: ALIGNMENT.START,
  text: {
    fontSize: 12,
  },
}

export default class TextLayer extends LayerBase {
  #data = ''

  #textData = null

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['text'])
    this.className = 'chart-text'
  }

  // data is string
  setData(data) {
    // this.#data = this.createData('base', this.#data, data)  // 此处走createData数据类型不一致回报错，回头在仔细研究下
    this.#data = data || this.#data
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, text} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize} = text
    let [x, y] = [0, 0]
    // horizontal position
    if (align === ALIGNMENT.START) {
      x = left
    } else if (align === ALIGNMENT.MIDDLE) {
      x = left + (width - getTextWidth(this.#data, fontSize)) / 2
    } else if (align === ALIGNMENT.END) {
      x = left + width - getTextWidth(this.#data, fontSize)
    }
    // vertical position
    if (verticalAlign === ALIGNMENT.START) {
      y = top + fontSize
    } else if (verticalAlign === ALIGNMENT.MIDDLE) {
      y = top + (height + fontSize) / 2
    } else if (verticalAlign === ALIGNMENT.END) {
      y = top + height
    }
    this.#textData = this.createText({x, y, value: this.#data.data, style: text})
  }

  draw() {
    const textData = {
      data: [this.#textData.value === 'undefined' ? this.#data : this.#textData.value], // v4text修改报错临时修改，需要仔细排查
      position: [[this.#textData.x, this.#textData.y]],
      ...this.#style.text,
    }
    this.drawBasic('text', [textData])
    console.log(textData)
  }
}
