import {sum, max} from 'd3'
import drawCircle from '../basic/circle'
import drawText from '../basic/text'
import LayerBase from './base'
import getTextWidth from '../util/text-wdith'
import needRedraw from '../util/need-redraw'

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 排列方向
const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const defaultStyle = {
  align: 'start',
  verticalAlign: 'start',
  direction: 'horizontal', // 'horizontal' | 'vertical'
  gap: [0, 0],
  pointSize: 12,
  text: {},
  point: {},
}

// 图例图层
export default class LegendLayer extends LayerBase {
  #container = null

  #data = ['']

  #style = {}

  #layout = {}

  #backup = []

  #circleData = []

  #textData = []

  get layout() {
    return this.#layout
  }

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = 'wave-legend'
    this.#container = this.options.root.append('g').attr('class', this.className)
    this.#container.append('g').attr('class', `${this.className}-circle`)
    this.#container.append('g').attr('class', `${this.className}-text`)
    this.setStyle(defaultStyle)
  }

  /**
   * 传入图例数据
   * @param {Array<String>} data 
   */
  setData(data) {
    this.#data = data || this.#data
  }

  // 显式传入布局
  setLayout(layout) {
    this.#layout = layout
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {align, verticalAlign, direction, pointSize} = this.#style
    const {left, top, width, height} = this.#layout
    const {fontSize = 12} = this.#style.text
    const [inner, outer] = this.#style.gap
    const maxHeight = max([pointSize, fontSize])
    // 确定圆的数据
    if (direction === directionType.HORIZONTAL) {
      this.#circleData = this.#data.map((text, i) => {
        const textWidth = sum(this.#data.slice(0, i).map(v => getTextWidth(v, fontSize)))
        return {
          cx: left + pointSize / 2 + (i ? (inner + outer + pointSize) * i + textWidth : 0),
          cy: top + maxHeight / 2,
          rx: pointSize / 2,
          ry: pointSize / 2,
        }
      })
    } else if (direction === directionType.VERTICAL) {
      this.#circleData = this.#data.map((text, i) => ({
        cx: left + pointSize / 2,
        cy: top + maxHeight / 2 + (i ? (outer + fontSize + pointSize) * i : 0),
        rx: pointSize / 2,
        ry: pointSize / 2,
      }))
    }
    // 根据圆的数据确定文字的数据
    this.#textData = this.#circleData.map(({cx, cy}, i) => ({
      text: this.#data[i],
      x: cx + pointSize / 2 + inner,
      y: cy + fontSize / 4, // 神奇的数字
    }))
    // 最后根据 align 整体移动，默认都是 start
    let [totalWidth, totalHeight] = [0, 0]
    if (direction === directionType.HORIZONTAL) {
      const {x, text} = this.#textData[this.#textData.length - 1]
      totalWidth = x - left + getTextWidth(text, fontSize)
      totalHeight = maxHeight
    } else if (direction === directionType.VERTICAL) {
      const {y} = this.#textData[this.#textData.length - 1]
      totalWidth = pointSize + inner + max(this.#data.map(text => getTextWidth(text, fontSize)))
      totalHeight = y - top + maxHeight
    }
    const [offsetX, offsetY] = [width - totalWidth, height - totalHeight]
    const [isHorizontalMiddle, isHorizontalEnd] = [align === alignType.MIDDLE, align === alignType.END]
    const [isVerticalMiddle, isVerticalEnd] = [verticalAlign === alignType.MIDDLE, verticalAlign === alignType.END]
    this.#circleData = this.#circleData.map(({cx, cy, ...size}) => ({
      ...size,
      cx: cx + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      cy: cy + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0), 
    }))
    this.#textData = this.#textData.map(({x, y, text}) => ({
      text,
      x: x + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
    }))
  }

  draw() {
    // 圆点
    const circleBackup = {
      data: this.#circleData.map(({rx, ry}) => [rx, ry]),
      position: this.#circleData.map(({cx, cy}) => [cx, cy]),
      container: this.#container.selectAll(`.${this.className}-circle`),
      className: `${this.className}-circle-el`,
      ...this.#style.circle,
    }
    // 判断是否进行重新绘制
    if (needRedraw(this.#backup.circle, circleBackup)) {
      this.#backup.circle = circleBackup
      drawCircle(circleBackup)
    }
    // 文字
    const textBackup = {
      data: this.#textData.map(({text}) => text),
      position: this.#textData.map(({x, y}) => [x, y]),
      container: this.#container.selectAll(`.${this.className}-text`),
      className: `${this.className}-text-el`,
      ...this.#style.text,
    }
    // 判断是否进行重新绘制
    if (needRedraw(this.#backup.text, textBackup)) {
      this.#backup.text = textBackup
      drawText(textBackup)
    }
  }
}
