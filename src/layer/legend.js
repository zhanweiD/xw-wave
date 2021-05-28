import {sum, max} from 'd3'
import {cloneDeep, isArray} from 'lodash'
import LayerBase from './base'
import getTextWidth from '../util/text-width'
import formatText from '../util/format-text'

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

// 默认样式
const defaultStyle = {
  align: alignType.START,
  verticalAlign: alignType.END,
  direction: directionType.HORIZONTAL,
  gap: [0, 0],
  pointSize: 12,
  text: {
    fill: 'white',
  },
  point: {},
}

// 图例图层
export default class LegendLayer extends LayerBase {
  #data = ['']

  #style = defaultStyle

  #textData = []

  #circleData = []

  #colors = []

  #textColors = []

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
  }

  /**
   * 传入图例数据
   * @param {LayerBase} layer 
   */
  setData(layer) {
    let textColors = null
    const disableHeaders = []
    const {data, options} = layer
    this.#data = (data && data.data.slice(1).map(({header}) => header)) || this.#data
    const colors = options.getColor(this.#data.length)
    this.#colors = cloneDeep(colors)
    // 数据筛选
    this.event.off('click-circle')
    this.event.on('click-circle', object => {
      // 这个数据结构是统一的
      const legendValue = object.data.source.value
      const headers = layer.data.data.map(({header}) => header).filter(header => header !== legendValue)
      const colorIndex = data.data.findIndex(({header}) => header === legendValue) - 1
      const disableIndex = disableHeaders.findIndex(header => header === legendValue)
      // 初始化文字颜色
      if (!isArray(this.#style.text.fill)) {
        textColors = new Array(colors.length).fill(this.#style.text.fill || 'white')
      } else {
        textColors = this.#style.text.fill
      }
      // 恢复和备份
      if (disableIndex !== -1) {
        headers.push(legendValue)
        disableHeaders.splice(disableIndex, 1)
        this.#colors[colorIndex] = colors[colorIndex]
        this.#textColors[colorIndex] = textColors[colorIndex]
      } else {
        disableHeaders.push(legendValue)
        this.#colors[colorIndex] = '#E2E3E588'
        this.#textColors[colorIndex] = '#E2E3E588'
      }
      // 更新绑定的图层
      layer.setData(data.select(headers))
      layer.setStyle()
      layer.draw()
      // 更新图例样式
      this.setStyle()
      this.draw()
    })
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, direction, pointSize} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12, format} = this.#style.text
    const [inner, outer] = this.#style.gap
    const maxHeight = max([pointSize, fontSize])
    // 格式化图例数据
    const data = format ? this.#data.map(value => formatText(value, format)) : this.#data
    // 确定圆的数据
    if (direction === directionType.HORIZONTAL) {
      this.#circleData = data.map((item, i) => {
        const textWidth = sum(data.slice(0, i).map(value => getTextWidth(value, fontSize)))
        return {
          cx: left + pointSize / 2 + (i ? (inner + outer + pointSize) * i + textWidth : 0),
          cy: top + maxHeight / 2,
          rx: pointSize / 2,
          ry: pointSize / 2,
        }
      })
    } else if (direction === directionType.VERTICAL) {
      this.#circleData = data.map((item, i) => ({
        cx: left + pointSize / 2,
        cy: top + maxHeight / 2 + (i ? (outer + fontSize + pointSize) * i : 0),
        rx: pointSize / 2,
        ry: pointSize / 2,
      }))
    }
    // 根据圆的数据确定文字的数据
    this.#textData = this.#circleData.map(({cx, cy}, i) => ({
      value: data[i],
      x: cx + pointSize / 2 + inner,
      y: cy + fontSize / 2,
    }))
    // 最后根据 align 整体移动，默认都是 start
    let [totalWidth, totalHeight] = [0, 0]
    if (direction === directionType.HORIZONTAL) {
      const {x, value} = this.#textData[this.#textData.length - 1]
      totalWidth = x - left + getTextWidth(value, fontSize)
      totalHeight = maxHeight
    } else if (direction === directionType.VERTICAL) {
      const {y} = this.#textData[this.#textData.length - 1]
      totalWidth = pointSize + inner + max(data.map(value => getTextWidth(value, fontSize)))
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
    this.#textData = this.#textData.map(({x, y, value}) => ({
      value,
      x: x + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
    }))
  }

  draw() {
    const circleData = this.#circleData.map(({rx, ry, cx, cy}, i) => ({
      data: [[rx, ry]],
      position: [[cx, cy]],
      fill: this.#colors[i],
      source: [{value: this.#data[i]}],
      ...this.#style.circle,
    }))
    const textData = this.#textData.map(({value, x, y}, i) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.text,
      fill: this.#textColors[i],
    }))
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}
